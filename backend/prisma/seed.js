import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create or update test account
    const account = await prisma.account.upsert({
        where: {
            email: "test@gmail.com"
        },
        update: {},
        create: {
            supabaseUserId: "test-user-001",
            email: "test@gmail.com",
            fullName: "Rakshith Kulal"
        }
    });

    console.log("✅ Account ready");

    // Delete existing profiles for this account
    await prisma.patientProfile.deleteMany({
        where: {
            accountId: account.id
        }
    });

    // Create fresh profiles
    await prisma.patientProfile.createMany({
        data: [
            {
                accountId: account.id,
                fullName: "Rakshith Kulal",
                age: 22,
                gender: "MALE",
                bloodGroup: "O_POSITIVE"
            },
            {
                accountId: account.id,
                fullName: "Father",
                age: 50,
                gender: "MALE",
                bloodGroup: "O_POSITIVE"
            },
            {
                accountId: account.id,
                fullName: "Mother",
                age: 47,
                gender: "FEMALE",
                bloodGroup: "A_POSITIVE"
            }
        ]
    });

    console.log("✅ Patient profiles created");
    console.log("🎉 Database seeding completed!");
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });