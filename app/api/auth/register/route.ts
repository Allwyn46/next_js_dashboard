import { generateToken, hashpassword } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'
import { Role } from '@/app/types'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, teamcode } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                {
                    error: 'All fields are required',
                },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                {
                    error: 'Email Already Exists',
                },
                { status: 409 }
            )
        }

        let teamId: string | undefined
        if (teamcode) {
            const team = await prisma.team.findUnique({
                where: { code: teamcode },
            })

            if (!team) {
                return NextResponse.json(
                    {
                        error: 'Team Not found!',
                    },
                    { status: 400 }
                )
            }

            teamId = team.id
        }

        const hashedPassword = await hashpassword(password)

        const userCount = await prisma.user.count()
        const role = userCount === 0 ? Role.ADMIN : Role.USER

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                teamId,
            },
            include: {
                team: true,
            },
        })

        const token = generateToken(user.id)

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    teamId: user.teamId,
                    team: user.team,
                    token,
                },
            },
            { status: 400 }
        )

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        })

        return response
    } catch (error) {
        console.error('Registration Failed', error)
        return NextResponse.json(
            {
                error: 'Something Went Wrong',
            },
            { status: 500 }
        )
    }
}
