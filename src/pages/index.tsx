import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

interface Notification {
    id: number;
    message: string;
    title: string;
    priority: number;
    date: string;
}

export default function Home() {
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
    const ws = useRef<WebSocket | null>(null)

    useEffect(() => {
        const gotifyUrl = process.env.NEXT_PUBLIC_GOTIFY_URL;
        const gotifyClientToken = process.env.NEXT_PUBLIC_GOTIFY_CLIENT_TOKEN;

        if (!gotifyUrl || !gotifyClientToken) {
            console.error('Gotify configuration missing');
            setConnectionStatus('Configuration Error');
            return;
        }

        const wsUrl = gotifyUrl.replace(/^http/, 'ws')
        ws.current = new WebSocket(`${wsUrl}/stream?token=${gotifyClientToken}`)

        ws.current.onopen = () => {
            console.log('WebSocket connection opened')
            setConnectionStatus('Connected')
        }

        ws.current.onmessage = (event) => {
            console.log('Received message:', event.data)
            const data = JSON.parse(event.data) as Notification
            setNotifications(prev => [...prev, data])
        }

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error)
            setConnectionStatus('Error: ' + error.type)
        }

        ws.current.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason)
            setConnectionStatus('Disconnected')
        }

        return () => {
            console.log('Closing WebSocket connection')
            if (ws.current) {
                ws.current.close()
            }
        }
    }, []);

    const sendNotification = async () => {
        try {
            await axios.post('/api/send-notification', { message, title });
            setMessage('');
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gotify Notification Demo</h1>
            <p>Connection Status: {connectionStatus}</p>
            <div className={styles.formGroup}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.field}
                    placeholder="Enter notification title"
                />
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={styles.field}
                    rows={5}
                    placeholder="Enter notification message"
                />
                <button
                    onClick={sendNotification}
                    className={styles.button}
                >
                    Send Notification
                </button>
            </div>
            <div>
                <h2 className={styles.subtitle}>Received Notifications:</h2>
                <ul className={styles.notificationList}>
                    {notifications.map((notification) => (
                        <li key={notification.id} className={styles.notificationItem}>
                            {notification.message}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
