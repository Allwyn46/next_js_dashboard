import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Role, User } from '../types'
import { cookies } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET!

export const hashpassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10)
}

export const verifypassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): { userId: string } => {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
}

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (!token) return null

        const decode = verifyToken(token)

        const userFromDB = await prisma.user.findUnique({
            where: { id: decode.userId },
        })

        if (!userFromDB) return null

        const { password, ...user } = userFromDB

        return user as User
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}

export const checkUserRole = (user: User, requiredRole: Role): boolean => {
    const roleHierarchy = {
        [Role.GUEST]: 0,
        [Role.USER]: 1,
        [Role.MANAGER]: 2,
        [Role.ADMIN]: 3,
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}
