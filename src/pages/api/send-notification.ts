import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type SuccessResponse = { success: boolean };
type ErrorResponse = { error: string };
type Data = SuccessResponse | ErrorResponse;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    switch (req.method) {
        case 'POST':
            return handlePost(req, res);
        default:
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<Data>) {
    const { message, title } = req.body;
    const gotifyUrl = process.env.GOTIFY_URL;
    const gotifyToken = process.env.GOTIFY_APP_TOKEN;

    if (!gotifyUrl || !gotifyToken) {
        return res.status(500).json({ error: 'Gotify configuration missing' });
    }

    try {
        await axios.post(`${gotifyUrl}/message`, {
            message: message,
            title: title,
            priority: 5
        }, {
            headers: {
                'X-Gotify-Key': gotifyToken
            }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
}
