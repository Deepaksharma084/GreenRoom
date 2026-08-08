export default function MeetingPage({ match }) {
    const { roomId } = match.params;

    return (
        <div>
            <h1>Meeting Page</h1>
            <p>Room ID: {roomId}</p>
        </div>
    )
}