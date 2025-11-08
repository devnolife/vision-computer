const { PrismaClient } = require('./frontend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkJob() {
  const jobId = '9bc28199-3a9d-440f-9d0f-b6ea07d74695';

  console.log('Checking job:', jobId);
  console.log('='.repeat(70));

  const doc = await prisma.document.findFirst({
    where: { jobId: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      jobId: true,
      requiresApproval: true,
      approvalStatus: true,
      uploadedAt: true,
      pdfPath: true,
      uploadPath: true
    }
  });

  if (doc) {
    console.log('✅ Document found:');
    console.log(JSON.stringify(doc, null, 2));
  } else {
    console.log('❌ No document found with jobId:', jobId);
  }

  await prisma.$disconnect();
}

checkJob().catch(console.error);
