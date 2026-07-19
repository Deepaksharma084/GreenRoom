import { useSearchParams } from 'react-router-dom';

export default function CreateOrJoinRoomPage() {
    const [searchParams] = useSearchParams(); //reads the name from the URL query (we passed using encodedURIComponents in the LoginPage.jsx file))
    const guestName = searchParams.get('name') || 'Guest';

    return (
        <div>
            <p>
                welcome to create and join room page
                <br />
                Hello, {guestName}!
            </p>
        </div>
    );
}