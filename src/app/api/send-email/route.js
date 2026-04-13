import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    // Menangkap data yang dikirim dari form mahasiswa
    const body = await request.json();
    const { nama, ruangan, tanggal, jam, keperluan } = body;

    // Konfigurasi Email Pengirim (Gunakan data dari Langkah 1)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "lab.ro@itera.ac.id",
        pass: "snpdkulwqyozntyf",
      },
    });

    // Desain isi emailnya
    const mailOptions = {
    from: "Sistem SILABOR ITERA <lab.ro@itera.ac.id>",
    // Gunakan tanda koma untuk memisahkan antar email
    to: "aselia.sherly@staff.itera.ac.id, boy.tarigan@ro.itera.ac.id",
    subject: ` Pengajuan Baru: ${ruangan} - ${nama}`,
    html: `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #ea580c;">Halo Tim Laboran! 👋</h2>
        <p>Ada pengajuan peminjaman ruangan baru yang masuk dan menunggu persetujuan Anda di SILABOR.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Peminjam:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${nama}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Ruangan:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${ruangan}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Waktu:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${tanggal} | ${jam}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Keperluan:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${keperluan}</td></tr>
        </table>
        <p style="margin-top: 20px;">Silakan login ke Dashboard Laboran untuk meninjau pengajuan ini.</p>
    </div>
    `,
    };

    // Eksekusi pengiriman email
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: "Email sukses terkirim!" }), { status: 200 });

  } catch (error) {
    console.error("Error kirim email:", error);
    return new Response(JSON.stringify({ message: "Gagal kirim email" }), { status: 500 });
  }
}