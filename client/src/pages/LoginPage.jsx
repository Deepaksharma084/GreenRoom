import react from 'react';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Login logic here
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-red-500">
            <div>

            </div>
        </div>
    );
}