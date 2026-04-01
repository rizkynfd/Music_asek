import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GenreCard - A colorful card displaying a music genre.
 * Clicking navigates to the Search page filtered by that genre.
 */
export default function GenreCard({ genre }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/search?genre=${genre.id}`);
    };

    return (
        <div
            className="genre-card"
            style={{ background: genre.color }}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <span className="genre-card-name">{genre.name}</span>
            <img
                src={genre.coverUrl}
                alt={genre.name}
                className="genre-card-img"
            />
        </div>
    );
}
