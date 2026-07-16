CREATE DATABASE greenroom;

-- Connect to the database before running the rest of the below tables.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_code VARCHAR(20) UNIQUE NOT NULL,

    host_user_id UUID,
    host_guest_id UUID,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,

    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ENDED')),

    CONSTRAINT fk_host_user
        FOREIGN KEY (host_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_host_guest
        FOREIGN KEY (host_guest_id)
        REFERENCES guest_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT only_one_host
        CHECK (
            (host_user_id IS NOT NULL AND host_guest_id IS NULL)
            OR
            (host_user_id IS NULL AND host_guest_id IS NOT NULL)
        )
);

CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    meeting_id UUID NOT NULL,

    user_id UUID,
    guest_session_id UUID,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,

    CONSTRAINT fk_meeting
        FOREIGN KEY (meeting_id)
        REFERENCES meetings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_guest
        FOREIGN KEY (guest_session_id)
        REFERENCES guest_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT only_one_participant
        CHECK (
            (user_id IS NOT NULL AND guest_session_id IS NULL)
            OR
            (user_id IS NULL AND guest_session_id IS NOT NULL)
        )
);