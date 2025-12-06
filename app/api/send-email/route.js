import nodemailer from "nodemailer";
import { emailConfig } from "../config/config.mail"

export async function POST(req) {
    try {
        const { email, message, subject } = await req.json();
        const transporter = await nodemailer.createTransport({
            service: emailConfig.mailService,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        })

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message
        })

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    catch (err) {
        return new Response(JSON.stringify({ success: false, error: err }), {
            status: 500,
        });
    }
}