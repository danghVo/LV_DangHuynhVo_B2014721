import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const teacherPass = await argon2.hash('Cayhuong@123');

    const teacher = await prisma.user.create({
        data: {
            email: 'teacher@gmail.com',
            password: teacherPass,
            role: 'TEACHER',
            name: 'Teacher',
            isVerify: true,
            age: 30,
        },
    });

    const studentPass = await argon2.hash('Cayhuong@123');

    const student = await prisma.user.create({
        data: {
            email: 'student@gmail.com',
            password: studentPass,
            role: 'STUDENT',
            name: 'student',
            age: 15,
            isVerify: true,
        },
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
    });
