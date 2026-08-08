import { useParams } from 'react-router-dom'

export default function MeetingPage() {
    const { roomId } = useParams()
    console.log('MeetingPage roomId:', roomId)

    return (
        <div>
            <h1>Meeting Page</h1>
            <p>Room ID: {roomId}</p>
        </div>
    )
}