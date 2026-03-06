import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const cep = searchParams.get('cep');

    if (!cep) {
        return NextResponse.json(
            { error: 'CEP is required' },
            { status: 400 }
        );
    }

    // Remove any non-numeric characters from CEP
    const cleanCep = cep.replace(/\D/g, '');

    // Validate CEP format (must be 8 digits)
    if (cleanCep.length !== 8) {
        return NextResponse.json(
            { error: 'CEP must have 8 digits' },
            { status: 400 }
        );
    }

    try {
        // Fetch data from ViaCEP API
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch CEP data' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // ViaCEP returns { erro: true } when CEP is not found
        if (data.erro) {
            return NextResponse.json(
                { error: 'CEP not found' },
                { status: 404 }
            );
        }

        // Return formatted data
        return NextResponse.json({
            cep: data.cep,
            logradouro: data.logradouro,
            complemento: data.complemento,
            bairro: data.bairro,
            localidade: data.localidade,
            uf: data.uf,
            ibge: data.ibge,
            gia: data.gia,
            ddd: data.ddd,
            siafi: data.siafi
        });
    } catch (error) {
        console.error('Error fetching CEP:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
