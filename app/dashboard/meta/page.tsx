import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Dashboard - TUTORIN",
  description: "Dashboard konsultasi minat bakat dan karir mahasiswa",
};

const MetaPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Dashboard for TUTORIN!</p>
    </div>
  );
};

export default MetaPage;
