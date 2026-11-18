import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const PORTFOLIO_DIR = path.join(UPLOADS_DIR, 'portfolio');
const RESUMES_DIR = path.join(UPLOADS_DIR, 'resumes');
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, 'attachments');
const GIG_IMAGES_DIR = path.join(UPLOADS_DIR, 'gig_images');

// Ensure directories exist
[UPLOADS_DIR, AVATARS_DIR, PORTFOLIO_DIR, RESUMES_DIR, ATTACHMENTS_DIR, GIG_IMAGES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const saveBase64ToFile = (base64Str: string, folder: string, filePrefix: string): string | null => {
  if (!base64Str || !base64Str.startsWith('data:')) return null;

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('pdf')) ext = 'pdf';

    const filename = `${filePrefix}_${Date.now()}.${ext}`;
    const filePath = path.join(folder, filename);
    fs.writeFileSync(filePath, buffer);

    const relativeFolder = path.basename(folder);
    return `/uploads/${relativeFolder}/${filename}`;
  } catch (err) {
    console.error('Failed to convert base64 to file:', err);
    return null;
  }
};

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed');

  // 1. Sanitize Users
  const users = await db.collection('users').find({}).toArray();
  console.log(`Auditing ${users.length} users...`);

  for (const u of users) {
    if (u.avatar && (u.avatar.startsWith('data:') || u.avatar.length > 500)) {
      console.log(`Found heavy avatar for user ${u.email} (${(u.avatar.length / 1024).toFixed(1)} KB). Converting to file...`);
      const fileUrl = saveBase64ToFile(u.avatar, AVATARS_DIR, `avatar_${u._id}`);
      const newAvatarUrl = fileUrl || '';
      await db.collection('users').updateOne(
        { _id: u._id },
        { $set: { avatar: newAvatarUrl } }
      );
      console.log(`Updated user ${u.email} avatar -> ${newAvatarUrl}`);
    }
  }

  // 2. Sanitize Profiles
  const profiles = await db.collection('profiles').find({}).toArray();
  console.log(`Auditing ${profiles.length} profiles...`);

  for (const p of profiles) {
    let modified = false;
    const updates: any = {};

    if (p.avatar && (p.avatar.startsWith('data:') || p.avatar.length > 500)) {
      console.log(`Found heavy avatar in profile ${p._id} (${(p.avatar.length / 1024).toFixed(1)} KB).`);
      const fileUrl = saveBase64ToFile(p.avatar, AVATARS_DIR, `avatar_${p.user}`);
      updates.avatar = fileUrl || '';
      modified = true;
    }

    if (p.resumeUrl && (p.resumeUrl.startsWith('data:') || p.resumeUrl.length > 500)) {
      console.log(`Found heavy resumeUrl in profile ${p._id} (${(p.resumeUrl.length / 1024).toFixed(1)} KB).`);
      const fileUrl = saveBase64ToFile(p.resumeUrl, RESUMES_DIR, `resume_${p.user}`);
      updates.resumeUrl = fileUrl || '';
      modified = true;
    }

    if (Array.isArray(p.portfolio)) {
      const updatedPortfolio = p.portfolio.map((item: any, idx: number) => {
        if (item.url && (item.url.startsWith('data:') || item.url.length > 500)) {
          console.log(`Found heavy portfolio image in profile ${p._id}, item ${idx} (${(item.url.length / 1024).toFixed(1)} KB).`);
          const fileUrl = saveBase64ToFile(item.url, PORTFOLIO_DIR, `portfolio_${p.user}_${idx}`);
          modified = true;
          return { ...item, url: fileUrl || '' };
        }
        return item;
      });
      if (modified) {
        updates.portfolio = updatedPortfolio;
      }
    }

    if (modified) {
      await db.collection('profiles').updateOne(
        { _id: p._id },
        { $set: updates }
      );
      console.log(`Updated profile ${p._id} with lightweight file paths.`);
    }
  }

  // 3. Sanitize Gigs
  const gigs = await db.collection('gigs').find({}).toArray();
  console.log(`Auditing ${gigs.length} gigs...`);

  for (const g of gigs) {
    let modified = false;
    const updates: any = {};

    if (Array.isArray(g.attachments)) {
      const updatedAttachments = g.attachments.map((att: any, idx: number) => {
        if (att.url && (att.url.startsWith('data:') || att.url.length > 500)) {
          console.log(`Found heavy attachment in gig "${g.title}" (${(att.url.length / 1024).toFixed(1)} KB). Converting to file...`);
          const fileUrl = saveBase64ToFile(att.url, ATTACHMENTS_DIR, `attachment_${g._id}_${idx}`);
          modified = true;
          return { ...att, url: fileUrl || '' };
        }
        return att;
      });
      if (modified) {
        updates.attachments = updatedAttachments;
      }
    }

    if (Array.isArray(g.images)) {
      let imagesModified = false;
      const updatedImages = g.images.map((img: string, idx: number) => {
        if (typeof img === 'string' && (img.startsWith('data:') || img.length > 500)) {
          console.log(`Found heavy image in gig "${g.title}" (${(img.length / 1024).toFixed(1)} KB). Converting to file...`);
          const fileUrl = saveBase64ToFile(img, GIG_IMAGES_DIR, `gig_img_${g._id}_${idx}`);
          imagesModified = true;
          return fileUrl || '';
        }
        return img;
      });
      if (imagesModified) {
        updates.images = updatedImages;
        modified = true;
      }
    }

    if (modified) {
      await db.collection('gigs').updateOne(
        { _id: g._id },
        { $set: updates }
      );
      console.log(`Updated gig "${g.title}" (${g._id}) with lightweight file paths.`);
    }
  }

  // 4. Sanitize Orders deliverables
  const orders = await db.collection('orders').find({}).toArray();
  console.log(`Auditing ${orders.length} orders...`);
  for (const o of orders) {
    let modified = false;
    if (Array.isArray(o.deliverables)) {
      const updatedDeliverables = o.deliverables.map((deliv: any, dIdx: number) => {
        if (Array.isArray(deliv.attachments)) {
          let attsModified = false;
          const updatedAtts = deliv.attachments.map((att: string, aIdx: number) => {
            if (typeof att === 'string' && (att.startsWith('data:') || att.length > 500)) {
              console.log(`Found heavy deliverable attachment in order ${o._id} (${(att.length / 1024).toFixed(1)} KB).`);
              const fileUrl = saveBase64ToFile(att, ATTACHMENTS_DIR, `deliv_${o._id}_${dIdx}_${aIdx}`);
              attsModified = true;
              return fileUrl || '';
            }
            return att;
          });
          if (attsModified) {
            modified = true;
            return { ...deliv, attachments: updatedAtts };
          }
        }
        return deliv;
      });
      if (modified) {
        await db.collection('orders').updateOne(
          { _id: o._id },
          { $set: { deliverables: updatedDeliverables } }
        );
        console.log(`Updated order ${o._id} deliverables.`);
      }
    }
  }

  console.log('Migration completed successfully!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
