import { useParams } from 'react-router-dom'

export default function MeetingPage() {
    const { roomId } = useParams()
    console.log('MeetingPage roomId:', roomId)

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div>
                <h1>Meeting Page</h1>
                <p>Room ID: {roomId}</p>
            </div>
        </div>
    )
}