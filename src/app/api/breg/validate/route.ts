import { NextResponse } from "next/server";
import { getCompanyByOrgNumber, isValidOrgNumber } from "@/lib/services/breg";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orgNumber?: string;
      companyName?: string;
    };

    const orgNumber = body.orgNumber?.replace(/\s/g, "") ?? "";
    const companyName = body.companyName?.trim() ?? "";

    if (!isValidOrgNumber(orgNumber)) {
      return NextResponse.json(
        { valid: false, error: "Ugyldig organisasjonsnummer" },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { valid: false, error: "Bedriftsnavn mangler" },
        { status: 400 }
      );
    }

    const company = await getCompanyByOrgNumber(orgNumber);
    if (!company) {
      return NextResponse.json(
        { valid: false, error: "Fant ikke bedriften i Brønnøysundregistrene" },
        { status: 404 }
      );
    }

    if (company.name.trim().toLowerCase() !== companyName.trim().toLowerCase()) {
      return NextResponse.json(
        { valid: false, error: "Bedriftsnavnet stemmer ikke med organisasjonsnummeret" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: alreadyRegistered, error: rpcError } = await supabase.rpc(
      "is_org_number_registered",
      { p_org_number: orgNumber }
    );

    if (rpcError) {
      console.error("is_org_number_registered RPC error:", rpcError);
      return NextResponse.json(
        { valid: false, error: "Kunne ikke verifisere bedrift. Prøv igjen." },
        { status: 500 }
      );
    }

    if (alreadyRegistered) {
      return NextResponse.json(
        {
          valid: false,
          error: "Bedriften med dette organisasjonsnummeret er allerede registrert",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ valid: true, company });
  } catch (error) {
    console.error("BREG validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Kunne ikke validere bedrift" },
      { status: 500 }
    );
  }
}
