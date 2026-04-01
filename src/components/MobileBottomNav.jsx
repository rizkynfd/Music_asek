import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, MagnifyingGlass, Books } from 'phosphor-react';

export default function MobileBottomNav() {
    const location = useLocation();

    return (
        <nav className="mobile-bottom-nav glass-panel hidden-desktop">
            <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <House size={26} weight={location.pathname === '/' ? 'fill' : 'regular'} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <MagnifyingGlass size={26} weight={location.pathname === '/search' ? 'bold' : 'regular'} />
                <span>Search</span>
            </NavLink>
            <NavLink to="/library" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Books size={26} weight={location.pathname === '/library' ? 'fill' : 'regular'} />
                <span>Koleksi Kamu</span>
            </NavLink>
        </nav>
    );
}
