import React from "react";

export function SearchBar() {
  return (
    <div className="search-bar hidden md:flex items-center justify-center ml-auto">
      <input className="search-input" placeholder="Ara" />
    </div>
  );
}
