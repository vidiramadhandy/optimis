'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Image from 'next/image';

//Fungsi Open/Close Pop Up
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isTopologyPopupOpen, setIsTopologyPopupOpen] = useState(false);
  const [isOTDRPopupOpen, setIsOTDRPopupOpen] = useState(false);
  const [isAPCConnectorPopupOpen, setIsAPCConnectorPopupOpen] = useState(false);
  const [isFiberPatchCablePopupOpen, setIsFiberPatchCablePopupOpen] = useState(false);
  const [isPCConnectorPopupOpen, setIsPCConnectorPopupOpen] = useState(false);
  const [isCouplerPopupOpen, setIsCouplerPopupOpen] = useState(false);
  const [isFiberPopupOpen, setIsFiberPopupOpen] = useState(false);
  const [isSFPPopupOpen, setIsSFPPopupOpen] = useState(false);
  const [isVOAPopupOpen, setIsVOAPopupOpen] = useState(false);
  const [isReflectorPopupOpen, setIsReflectorPopupOpen] = useState(false);
  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
// Fungsi Lock Scroll Bar Pop Up
  useEffect(() => {
    const isAnyPopupOpen = isTopologyPopupOpen || isOTDRPopupOpen || isAPCConnectorPopupOpen ||
      isFiberPatchCablePopupOpen || isPCConnectorPopupOpen || isCouplerPopupOpen ||
      isFiberPopupOpen || isSFPPopupOpen || isVOAPopupOpen || isReflectorPopupOpen;

    if (isAnyPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [isTopologyPopupOpen, isOTDRPopupOpen, isAPCConnectorPopupOpen, isFiberPatchCablePopupOpen,
      isPCConnectorPopupOpen, isCouplerPopupOpen, isFiberPopupOpen, isSFPPopupOpen, isVOAPopupOpen, isReflectorPopupOpen]);

  const brightnessAmount = scrollY > 0.175 ? 0.175 : 0.55

  const openTopologyPopup = () => setIsTopologyPopupOpen(true);
  const closeTopologyPopup = () => setIsTopologyPopupOpen(false);
  const openOTDRPopup = () => setIsOTDRPopupOpen(true);
  const closeOTDRPopup = () => setIsOTDRPopupOpen(false);
  const openAPCConnectorPopup = () => setIsAPCConnectorPopupOpen(true);
  const closeAPCConnectorPopup = () => setIsAPCConnectorPopupOpen(false);
  const openFiberPatchCablePopup = () => setIsFiberPatchCablePopupOpen(true);
  const closeFiberPatchCablePopup = () => setIsFiberPatchCablePopupOpen(false);
  const openPCConnectorPopup = () => setIsPCConnectorPopupOpen(true);
  const closePCConnectorPopup = () => setIsPCConnectorPopupOpen(false);
  const openCouplerPopup = () => setIsCouplerPopupOpen(true);
  const closeCouplerPopup = () => setIsCouplerPopupOpen(false);
  const openFiberPopup = () => setIsFiberPopupOpen(true);
  const closeFiberPopup = () => setIsFiberPopupOpen(false);
  const openSFPPopup = () => setIsSFPPopupOpen(true);
  const closeSFPPopup = () => setIsSFPPopupOpen(false);
  const openVOAPopup = () => setIsVOAPopupOpen(true);
  const closeVOAPopup = () => setIsVOAPopupOpen(false);
  const openReflectorPopup = () => setIsReflectorPopupOpen(true);
  const closeReflectorPopup = () => setIsReflectorPopupOpen(false);
  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />

      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `brightness(${brightnessAmount}) saturate(0.75) sepia(0.25) contrast(1.25)`,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transition: 'filter 500ms ease-in-out',
        }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16 overflow-y-auto">
        <main className="px-6 md:px-12 lg:px-20 xl:px-24">
          <div className="max-w-7xl mx-auto">

{/* Hero Section */}

<section className="mb-16">
   <h1
    className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-center"
    style={{
      fontFamily: "'Poppins', Arial, Helvetica, sans-serif",
      letterSpacing: '0.01em',
      textShadow: '0 2px 8px rgba(0,0,0,0.17)'
    }}
  ></h1>
  <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-12 text-white font-title leading-tight animate__animated animate__fadeInUp">
    About<br />
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
      OptiPredict
    </span>
  </h1>
</section>

{/* Introduction Section */}
<section className="mb-12 px-4">
  <p
    className="text-2xl md:text-2xl font-light text-white leading-relaxed text-center max-w-8xl mx-auto"
    style={{
      fontFamily: "Helvetica",
      lineHeight: '1.2',
      letterSpacing: '0.08em',
      textShadow: '0 9px 6px rgba(2,0,0,0.13)'
    }}
  >
    OptiPredict comes as an innovative machine learning-based solution for maintenance and fault management on optical networks. By utilizing integrated machine learning technology, OptiPredict allows users to automatically analyze data and predict various disturbances with a high level of accuracy.
  </p>
</section>


            {/* Topology Section */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  <strong>Basic Topology of OptiPredict</strong>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white bg-opacity-95 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="relative overflow-hidden rounded-xl">
                  <Image
                    src="/topology.jpg"
                    alt="Topologi Dasar OptiPredict"
                    width={1200}
                    height={700}
                    className="w-full h-auto object-contain"
                    priority
                  />

{/* PENGATURAN AREA POP UP */}
{/* Area klik OTDR */}
                  <div
                    className="absolute animate-pulse"
                      style={{
                        top: '47.8%',
                        left: '7.1%',
                        width: '3%',
                        height: '6.5%',
                        cursor: 'pointer',
                        borderRadius: '20%',
                        zIndex: 10,
                        border: '2px solid #3b82f6',
                        background: 'rgba(59,130,246,0.10)'
                      }}
                      onClick={openOTDRPopup}
                      title="Click to learn more about OTDR"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                      e.currentTarget.style.border = '2px solid #3b82f6';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />

{/* Area klik APC Connector */}
                  <div
                    className="absolute"
                    style={{
                      top: '49.4%',
                      left: '11.3%',
                      width: '1.5%',
                      height: '4.4%',
                      cursor: 'pointer',
                      borderRadius: '15%',
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openAPCConnectorPopup}
                    title="Click to learn more about APC Connector"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
                      e.currentTarget.style.border = '2px solid #ef4444';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />

{/* Area klik Fiber Patch Cable */}
{/* FIBER PATCH 1 */}
                  <div
                    className="absolute"
                    style={{
                      top: '45.9%',
                      left: '14.69%',
                      width: '0.9%',
                      height: '5.4%',
                      cursor: 'pointer',
                      borderRadius: '50%', // Oval shape
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openFiberPatchCablePopup}
                    title="Click to learn more about Fiber Patch Cable"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(251,191,36,0.18)';
                      e.currentTarget.style.border = '2px solid #fbbf24';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />
{/* FIBER PATCH 2 */}
                  <div
                    className="absolute"
                    style={{
                      top: '46.7%',
                      left: '39.2%',
                      width: '1.3%',
                      height: '3.5%',
                      cursor: 'pointer',
                      borderRadius: '50%', // Oval shape
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openFiberPatchCablePopup}
                    title="Click to learn more about Fiber Patch Cable"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(251,191,36,0.18)';
                      e.currentTarget.style.border = '2px solid #fbbf24';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />
{/* FIBER PATCH 3 */}
                  <div
                    className="absolute"
                    style={{
                      top: '29%',
                      left: '39%',
                      width: '1.3%',
                      height: '3.5%',
                      cursor: 'pointer',
                      borderRadius: '50%', // Oval shape
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openFiberPatchCablePopup}
                    title="Click to learn more about Fiber Patch Cable"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(251,191,36,0.18)';
                      e.currentTarget.style.border = '2px solid #fbbf24';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />
{/* FIBER PATCH 4 */}
                  <div
                    className="absolute"
                    style={{
                      top: '13%',
                      left: '56.13%',
                      width: '0.9%',
                      height: '5.9%',
                      cursor: 'pointer',
                      borderRadius: '50%', // Oval shape
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openFiberPatchCablePopup}
                    title="Click to learn more about Fiber Patch Cable"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(251,191,36,0.18)';
                      e.currentTarget.style.border = '2px solid #fbbf24';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />
{/* FIBER PATCH 5 */}
                  <div
                    className="absolute"
                    style={{
                      top: '31.5%',
                      left: '63%',
                      width: '1.3%',
                      height: '3.5%',
                      cursor: 'pointer',
                      borderRadius: '50%', // Oval shape
                      zIndex: 10,
                      transition: 'background 0.2s, border 0.2s',
                    }}
                    onClick={openFiberPatchCablePopup}
                    title="Click to learn more about Fiber Patch Cable"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(251,191,36,0.18)';
                      e.currentTarget.style.border = '2px solid #fbbf24';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.border = '2px solid transparent';
                    }}
                  />

{/* Area klik PC Connector 1 */}
{/* PC CONNECTOR 1 */}
                  <div
                  className="absolute"
                  style={{
                    top: '49%',
                    left: '17.1%',
                    width: '1.4%',
                    height: '4.6%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 2  */}
                  <div
                  className="absolute"
                  style={{
                    top: '15.5%',
                    left: '33.9%',
                    width: '1.4%',
                    height: '4.6%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 3  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.3%',
                    left: '42.33%',
                    width: '1.5%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 4  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.4%',
                    left: '48.2%',
                    width: '1.5%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 5  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.6%',
                    left: '53.64%',
                    width: '1.5%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 6  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.5%',
                    left: '58.7%',
                    width: '1.47%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 7  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.4%',
                    left: '66.7%',
                    width: '1.5%',
                    height: '4.3%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 8  */}
                  <div
                  className="absolute"
                  style={{
                    top: '16.6%',
                    left: '74.1%',
                    width: '1.5%',
                    height: '4.3%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 9  */}
                  <div
                  className="absolute"
                  style={{
                    top: '17.45%',
                    left: '83.1%',
                    width: '1.5%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* PC CONNECTOR 10  */}
                  <div
                  className="absolute"
                  style={{
                    top: '17.44%',
                    left: '88.55%',
                    width: '1.5%',
                    height: '4.4%',
                    cursor: 'pointer',
                    borderRadius: '15%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openPCConnectorPopup}
                  title="Klik untuk info PC Connector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

{/* Area klik Coupler (splitter, simbol 50/50) */}
{/* COUPLER 1 */}
                <div
                  className="absolute"
                  style={{
                    top: '47.7%',      // tweak sesuai posisi coupler di gambar
                    left: '20.1%',     // tweak sesuai posisi coupler di gambar
                    width: '2.65%',     // lebar sesuai simbol coupler
                    height: '6.6%',    // tinggi sesuai simbol coupler
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openCouplerPopup}
                  title="Klik untuk info Coupler/Splitter"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* COUPLER 2 */}
                <div
                  className="absolute"
                  style={{
                    top: '14.2%',      // tweak sesuai posisi coupler di gambar
                    left: '37.35%',     // tweak sesuai posisi coupler di gambar
                    width: '2.65%',     // lebar sesuai simbol coupler
                    height: '6.6%',    // tinggi sesuai simbol coupler
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openCouplerPopup}
                  title="Klik untuk info Coupler/Splitter"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* COUPLER 3 */}
                <div
                  className="absolute"
                  style={{
                    top: '14.8%',      // tweak sesuai posisi coupler di gambar
                    left: '61%',     // tweak sesuai posisi coupler di gambar
                    width: '2.65%',     // lebar sesuai simbol coupler
                    height: '6.6%',    // tinggi sesuai simbol coupler
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openCouplerPopup}
                  title="Klik untuk info Coupler/Splitter"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* COUPLER 4 */}
                <div
                  className="absolute"
                  style={{
                    top: '15.4%',      // tweak sesuai posisi coupler di gambar
                    left: '77.6%',     // tweak sesuai posisi coupler di gambar
                    width: '2.65%',     // lebar sesuai simbol coupler
                    height: '6.6%',    // tinggi sesuai simbol coupler
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openCouplerPopup}
                  title="Klik untuk info Coupler/Splitter"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

{/* Area klik Fiber (lingkaran merah, contoh di 10 km) */}
{/* FIBER 1 */}
                <div
                  className="absolute"
                  style={{
                    top: '11.2%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '25.1%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '2.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '6.9%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* FIBER 2 */}
                <div
                  className="absolute"
                  style={{
                    top: '80%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '23.8%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '2.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '6.9%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* FIBER 3 */}
                <div
                  className="absolute"
                  style={{
                    top: '11.98%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '44.2%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '2.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '6.9%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* FIBER 4 */}
                <div
                  className="absolute"
                  style={{
                    top: '12.6%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '68.7%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '2.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '6.9%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* FIBER 5 */}
                <div
                  className="absolute"
                  style={{
                    top: '13.3%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '85.2%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '2.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '6.9%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/* FIBER 6 */}
                <div
                  className="absolute"
                  style={{
                    top: '32.5%',     // tweak sesuai posisi lingkaran merah di gambar
                    left: '79.6%',    // tweak sesuai posisi lingkaran merah di gambar
                    width: '1.6%',    // kecil, hanya seukuran lingkaran merah
                    height: '9.4%',   // kecil, hanya seukuran lingkaran merah
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openFiberPopup}
                  title="Klik untuk info Fiber"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.14)';
                    e.currentTarget.style.border = '2px solid #dc2626';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

{/* Area klik SFP+ (rectangular grey, di dekat 25m) */}
                <div
                  className="absolute"
                  style={{
                    top: '44%',     // tweak sesuai posisi SFP+ di gambar
                    left: '64%',    // tweak sesuai posisi SFP+ di gambar
                    width: '1.1%',    // lebar sesuai SFP+ abu-abu
                    height: '9.2%',   // tinggi sesuai SFP+ abu-abu
                    cursor: 'pointer',
                    borderRadius: '0.25rem',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openSFPPopup}
                  title="Klik untuk info SFP+"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(107,114,128,0.18)';
                    e.currentTarget.style.border = '2px solid #6b7280';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

{/* Area klik VOA (lingkaran biru dengan panah, kanan atas topologi) */}
                <div
                  className="absolute"
                  style={{
                    top: '15.1%',     // tweak sesuai posisi VOA di gambar
                    left: '90.9%',    // tweak sesuai posisi VOA di gambar
                    width: '1.4%',    // lebar sesuai simbol VOA
                    height: '7.2%',   // tinggi sesuai simbol VOA
                    cursor: 'pointer',
                    borderRadius: '50%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openVOAPopup}
                  title="Klik untuk info Variable Optical Attenuator (VOA)"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.13)';
                    e.currentTarget.style.border = '2px solid #3b82f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

{/* Area klik Reflector (ikon panah melengkung di ujung kanan topologi) */}
{/*REFLECTOR 1*/}
                <div
                  className="absolute"
                  style={{
                    top: '17.5%',     // tweak sesuai posisi reflector di gambar
                    left: '95.8%',    // tweak sesuai posisi reflector di gambar
                    width: '0.3%',    // lebar sesuai simbol reflector
                    height: '5.5%',   // tinggi sesuai simbol reflector
                    cursor: 'pointer',
                    borderRadius: '30%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openReflectorPopup}
                  title="Klik untuk info Reflector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16,16,16,0.13)';
                    e.currentTarget.style.border = '2px solid #333';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />
{/*REFLECTOR 2*/}
                <div
                  className="absolute"
                  style={{
                    top: '21.2%',     // tweak sesuai posisi reflector di gambar
                    left: '94.8%',    // tweak sesuai posisi reflector di gambar
                    width: '1.2%',    // lebar sesuai simbol reflector
                    height: '2%',   // tinggi sesuai simbol reflector
                    cursor: 'pointer',
                    borderRadius: '30%',
                    zIndex: 10,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  onClick={openReflectorPopup}
                  title="Klik untuk info Reflector"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16,16,16,0.13)';
                    e.currentTarget.style.border = '2px solid #333';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                />

                </div>
                


{/* View Topology Explanation Button */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-800 italic">
                    💡 Tip: Click on a component in the topology above to learn more about it!
                  </p>
                </div>
              </div>
            </section>

{/* Features Section */}
<section className="mb-16 px-4">
  <p
        className="text-2xl md:text-2xl font-light text-white leading-relaxed text-center max-w-8xl mx-auto"
    style={{
      fontFamily: "Helvetica",
      lineHeight: '1.2',
      letterSpacing: '0.08em',
      textShadow: '0 9px 6px rgba(2,0,0,0.13)'
    }}
  >
    The platform is supported with a responsive user interface and allows quick access to optical network condition monitoring with easy-to-understand reports. Data management and reporting features allow users to keep a history of predictions and optimize the decision-making process regarding network maintenance, thus preventing damage before it occurs.
  </p>
</section>
          </div>
        </main>
      </div>

{/* BAGIAN PENJELASAN DAN ISI DALAM POP UP */}
{/* OTDR Explanation Popup */}
      {isOTDRPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeOTDRPopup}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">OTDR - Optical Time Domain Reflectometer</h3>
                <button
                  onClick={closeOTDRPopup}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              {/* OTDR Image */}
              <div className="mb-8 text-center">
                <Image
                  src="/otdr-device.png"
                  alt="OTDR Device"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg max-w-2xl mx-auto"
                  priority
                />
              </div>
              <div className="space-y-6">
                {/* What is OTDR */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is OTDR?
                  </h4>
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      <strong>OTDR (Optical Time Domain Reflectometer)</strong> is a primary measurement device used to analyze and diagnose the condition of optical fiber networks in a comprehensive manner. By sending light pulses and measuring the backscattered and reflected signals, the OTDR provides a detailed trace of the fiber, allowing technicians to assess the health, loss, and fault locations within the network.
                    </p>
                  </div>
                </div>
                {/* Main Functions */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h5 className="text-xl font-semibold mb-3 text-blue-600">📡 Main Functions</h5>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Sends light pulses into the optical fiber</li>
                    <li>• Measures the light that is backscattered and reflected</li>
                    <li>• Maps the location of splices and faults</li>
                    <li>• Analyzes the quality of optical transmission</li>
                  </ul>
                </div>
                {/* Importance in OptiPredict */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h5 className="text-xl font-semibold mb-3 text-yellow-700">⚠️ The Importance of OTDR in this Topology</h5>
                  <p className="text-gray-700 leading-relaxed">
                    In the OptiPredict system, the OTDR serves as the main "eye" that collects detailed data on the characteristics of the optical network. The data gathered by the OTDR is then analyzed using machine learning algorithms to predict the types of faults and provide precise maintenance recommendations, ensuring optimal network performance and reliability.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeOTDRPopup}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* APC Connector Explanation Popup */}
      {isAPCConnectorPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeAPCConnectorPopup}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">APC Connector - Angled Physical Contact</h3>
                <button
                  onClick={closeAPCConnectorPopup}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              <div className="mb-8 text-center">
                <Image
                  src="/apc-connector.png"
                  alt="APC Connector"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg max-w-2xl mx-auto"
                  priority
                />
              </div>
              <div className="space-y-6">
                {/* What is APC Connector */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is APC Connector?
                  </h4>
                  <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      <strong>APC (Angled Physical Contact) Connector</strong> is an optical fiber connector with a ferrule end-face polished at an 8° angle to minimize back reflection and enhance the performance of optical networks.
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h5 className="text-xl font-semibold mb-3 text-red-600">🔧 Main Characteristics</h5>
                    <ul className="space-y-2 text-gray-700">
                      <li>• 8° angled polish on the ferrule end-face</li>
                      <li>• Return loss &gt; 60 dB</li>
                      <li>• Insertion loss &lt; 0.2 dB</li>
                      <li>• Green color identification</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                  <h5 className="text-xl font-semibold mb-3 text-orange-600">🔬 How APC Works</h5>
                  <ol className="space-y-2 text-gray-700">
                    <li>
                      <strong>1. Angled Contact:</strong> The 8° angle ensures that reflected light does not return to the fiber core.
                    </li>
                    <li>
                      <strong>2. Light Redirection:</strong> Reflected light is directed into the cladding rather than back into the core.
                    </li>
                    <li>
                      <strong>3. Loss Reduction:</strong> Reduces noise and interference during transmission.
                    </li>
                    <li>
                      <strong>4. Signal Quality:</strong> Significantly improves signal quality.
                    </li>
                  </ol>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h5 className="text-xl font-semibold mb-3 text-yellow-700">⚠️ Important Notes</h5>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Compatibility:</strong> APC connectors must only be mated with other APC connectors.</p>
                    <p><strong>Warning:</strong> Do not connect APC to PC/UPC connectors, as this will cause high insertion loss and potential damage.</p>
                    <p><strong>Applications:</strong> Highly suitable for DWDM, FTTH, and high-speed data transmission systems.</p>
                  </div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h5 className="text-xl font-semibold mb-3 text-green-700">🎯 Usage in OptiPredict</h5>
                  <p className="text-gray-700 leading-relaxed">
                    In the OptiPredict topology, APC connectors are used at critical points that require extremely low return loss. The superior performance of APC connectors ensures accurate OTDR data and supports machine learning algorithms in providing more precise fault predictions.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeAPCConnectorPopup}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Fiber Patch Cable Explanation Popup */}
      {isFiberPatchCablePopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeFiberPatchCablePopup}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Fiber Patch Cable - Optical Interconnection</h3>
                <button
                  onClick={closeFiberPatchCablePopup}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              <div className="mb-8 text-center">
                <Image
                  src="/fiber-patch-cable.png"
                  alt="Fiber Patch Cable"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg max-w-2xl mx-auto"
                  priority
                />
              </div>
              <div className="space-y-6">
                {/* What is Fiber Patch Cable */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is Fiber Patch Cable?
                  </h4>
                  <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      <strong>Fiber Patch Cable</strong> is a short optical fiber cable with connectors at both ends, used to connect optical devices or to make temporary connections in fiber optic network installations[7][9].
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h5 className="text-xl font-semibold mb-3 text-yellow-600">🔌 Main Components</h5>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Fiber core (optical fiber core)</li>
                      <li>• Cladding (coating layer)</li>
                      <li>• Buffer coating (protective layer)</li>
                      <li>• Jacket (outer sheath)</li>
                      <li>• Connectors on both ends</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h5 className="text-xl font-semibold mb-3 text-green-600">⚡ Main Functions</h5>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Connecting optical devices</li>
                      <li>• Interconnection between panels</li>
                      <li>• Cross-connect within racks</li>
                      <li>• Patch panel connections</li>
                      <li>• Equipment-to-equipment linking</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                  <h5 className="text-xl font-semibold mb-3 text-blue-600">🔬 Types of Fiber Patch Cable</h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="font-semibold mb-2">Single-mode:</h6>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>• Core diameter: 9 μm</li>
                        <li>• For long-distance connections</li>
                        <li>• Standard color: yellow</li>
                        <li>• Wavelength: 1310nm, 1550nm</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-semibold mb-2">Multi-mode:</h6>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>• Core diameter: 50/62.5 μm</li>
                        <li>• For short-to-medium distances</li>
                        <li>• Color: orange (OM1/OM2), aqua (OM3/OM4)</li>
                        <li>• Wavelength: 850nm, 1300nm</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                  <h5 className="text-xl font-semibold mb-3 text-purple-600">🏗️ Technical Characteristics</h5>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h6 className="font-semibold text-purple-600 mb-2">Insertion Loss</h6>
                      <p className="text-sm text-gray-700">&lt; 0.3 dB (PC/UPC)<br />&lt; 0.2 dB (APC)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h6 className="font-semibold text-purple-600 mb-2">Return Loss</h6>
                      <p className="text-sm text-gray-700">&gt; 50 dB (UPC)<br />&gt; 60 dB (APC)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h6 className="font-semibold text-purple-600 mb-2">Durability</h6>
                      <p className="text-sm text-gray-700">&gt; 1000 mating cycles<br />Operating temp: -40°C to +85°C</p>
                    </div>
                  </div>
                </div>
                {/* Criteria for OTDR Patch Cables moved here */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h5 className="text-xl font-semibold mb-3 text-green-700">📋 Criteria for OTDR Patch Cables</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Low insertion loss for maximum accuracy</li>
                    <li>• High return loss to reduce noise</li>
                    <li>• Clean connector end-face</li>
                    <li>• Consistent polish quality</li>
                    <li>• Length according to measurement requirements</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h5 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h5>
                  <p className="text-gray-700 leading-relaxed">
                    In the OptiPredict topology, fiber patch cables serve as flexible connectors between the OTDR and various network components to be analyzed. The quality of the patch cable greatly affects the accuracy of OTDR measurements.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeFiberPatchCablePopup}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Topology Explanation Popup */}
      {isTopologyPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeTopologyPopup}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Topology Explanation</h3>
                <button
                  onClick={closeTopologyPopup}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              <div className="mb-8">
                <Image
                  src="/topology.jpg"
                  alt="Topologi Dasar OptiPredict"
                  width={1200}
                  height={700}
                  className="w-full h-auto rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}

{/* PC Connector Explanation Popup */}
{isPCConnectorPopupOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closePCConnectorPopup}></div>
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">PC Connector - Physical Contact Connector</h3>
          <button onClick={closePCConnectorPopup} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-8 text-gray-800">
        {/* Image */}
        <div className="mb-8 text-center">
          <Image
            src="/pc-connector.png"
            alt="PC Connector"
            width={800}
            height={600}
            className="mx-auto rounded-lg shadow-lg max-w-2xl"
            priority
          />
        </div>
        <div className="space-y-6">
          {/* What is PC Connector? */}
          <div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-4">
              What is a PC Connector?
            </h4>
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>PC (Physical Contact) Connector</strong> is an optical fiber connector with a ferrule end-face polished with a slight curve, allowing two fiber ferrules to make direct physical contact with no air gap. This design was developed to reduce back reflection (return loss), which is common in flat-polished connectors. The typical return loss of a PC connector is around -40 dB, which is much better than a flat connector, though still lower than UPC and APC connectors<sup>[8]</sup>.
              </p>
            </div>
          </div>

          {/* Main Characteristics */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h5 className="text-xl font-semibold mb-3 text-blue-600">📋 Main Characteristics</h5>
            <ul className="space-y-2 text-gray-700">
              <li>• The ferrule end-face is curved to ensure complete physical contact between fiber surfaces.</li>
              <li>• Reduces air gaps between two ferrules, thereby lowering back reflection.</li>
              <li>• Typical return loss is about -40 dB (better than flat connectors, but higher than UPC/APC).</li>
              <li>• Connector color is usually blue, distinguishing it from APC connectors (green).</li>
              <li>• Suitable for general network applications that do not require extremely low return loss.</li>
            </ul>
          </div>

          {/* Main Functions */}
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <h5 className="text-xl font-semibold mb-3 text-blue-600">🔧 Main Functions</h5>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Connects two optical fiber cables with low loss and minimal back reflection.</li>
              <li>Widely used in both singlemode and multimode networks, especially in optical distribution frames (ODF), patch panels, and other network equipment.</li>
              <li>Ensures stable data transmission with minimal signal interference.</li>
              <li>Becomes the standard in many network installations due to ease of use and good performance.</li>
            </ul>
          </div>

          {/* Advantages & Important Notes */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h5 className="text-xl font-semibold mb-3 text-yellow-700">⚠️ Advantages & Important Notes</h5>
            <ul className="list-disc ml-6 text-gray-700">
              <li>• Lower return loss compared to flat connectors, but higher than UPC/APC connectors.</li>
              <li>• Not recommended for high-precision or analog applications requiring minimal back reflection (use APC connectors for such cases).</li>
              <li>• The ferrule surface must always be kept clean to maintain optimal performance.</li>
              <li>• Should not be mated with APC connectors, as the difference in polish angles will cause high insertion loss.</li>
            </ul>
          </div>

          {/* Role in OptiPredict Topology */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h5 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h5>
            <p className="text-gray-700 leading-relaxed">
              In the OptiPredict topology, PC connectors are used at optical connection points that require good performance but do not demand extremely low return loss. These connectors ensure stable data transmission, support network monitoring, and simplify maintenance and troubleshooting processes within the optical fiber network.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={closePCConnectorPopup} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Coupler/Splitter Explanation Popup */}
      {isCouplerPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeCouplerPopup}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-400 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Optical Coupler / Splitter</h3>
                <button onClick={closeCouplerPopup} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              {/* Image */}
              <div className="mb-8 text-center">
                <Image
                  src="/coupler.png"
                  alt="Fiber Optic Coupler / Splitter"
                  width={800}
                  height={600}
                  className="mx-auto rounded-lg shadow-lg max-w-2xl"
                />
              </div>
              <div className="space-y-6">
                {/* What is Optical Coupler / Splitter? */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is an Optical Coupler / Splitter?
                  </h4>
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      <strong>Optical Coupler / Splitter</strong> is a passive device in fiber optic networks that splits a single optical signal into multiple output paths, or combines multiple signals into one output. This device is essential in modern network architectures such as FTTH, PON, and data centers, as it allows one light source to be distributed to many users or devices without the need for additional light sources.<br />
                      Couplers/splitters typically have input/output configurations like 1x2, 1x4, 1x8, up to 1x32 and beyond. The split ratio can be adjusted, for example, 50/50, 90/10, depending on the requirements for signal distribution.
                    </p>
                  </div>
                </div>

                {/* Working Principle & Types */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h5 className="text-xl font-semibold mb-3 text-blue-600">🔬 Working Principle & Types</h5>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <strong>Working Principle:</strong> Light entering the input of a coupler/splitter is divided into several output paths with a specific ratio through refraction, reflection, or physical separation of the fiber core.
                    </li>
                    <li>
                      <strong>Common Types:</strong>
                      <ul className="list-disc ml-6">
                        <li>
                          <b>FBT (Fused Biconical Taper) Coupler:</b> Made by heating and stretching two or more optical fibers until they fuse together. Common for small splits (1x2, 1x4), cost-effective, but sensitive to temperature and wavelength.
                        </li>
                        <li>
                          <b>PLC (Planar Lightwave Circuit) Splitter:</b> Uses waveguide technology on a glass substrate, suitable for large splits (1x8, 1x16, 1x32, etc.), more precise, stable against temperature and wavelength, and more compact in size.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Configuration:</strong> Splitter (splits signals), Combiner (combines signals), or Bidirectional (two-way operation as required by the network).
                    </li>
                  </ul>
                </div>

                {/* Main Functions */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h5 className="text-xl font-semibold mb-3 text-blue-600">🔧 Main Functions</h5>
                  <ul className="list-disc ml-6 text-gray-700 space-y-1">
                    <li>Splits an optical signal from one fiber into two or more fibers (e.g., 50/50, 90/10, etc.).</li>
                    <li>Combines signals from multiple fibers into one fiber.</li>
                    <li>Used in FTTH, monitoring, LAN, data center, and other optical distribution systems.</li>
                    <li>Supports point-to-multipoint topology in passive optical networks (PON).</li>
                    <li>Allows a single light source to serve many users efficiently.</li>
                  </ul>
                </div>

                {/* Characteristics & Advantages */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h5 className="text-xl font-semibold mb-3 text-yellow-700">💡 Characteristics & Advantages</h5>
                  <ul className="list-disc ml-6 text-gray-700">
                    <li>Passive device, does not require external power.</li>
                    <li>Low signal loss (especially with PLC splitters), stable against temperature and environmental changes.</li>
                    <li>Available in various sizes and configurations to suit network needs.</li>
                    <li>More cost-effective signal distribution compared to adding new cables or light sources.</li>
                    <li>PLC splitters offer more uniform and precise signal splitting for large-scale applications.</li>
                  </ul>
                </div>

                {/* Role in OptiPredict Topology */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h5 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h5>
                  <p className="text-gray-700 leading-relaxed">
                    In the OptiPredict topology, couplers/splitters are used to divide the optical signal from the OTDR into multiple monitoring paths, allowing efficient analysis of multiple points in the network. This device also simplifies network expansion without the need for additional light sources, greatly supporting flexibility and efficiency in optical network maintenance.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={closeCouplerPopup} className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Kabel Fiber Explanation Popup */}
     {isFiberPopupOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeFiberPopup}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-red-600 to-pink-400 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Fiber Optic Cable</h3>
              <button onClick={closeFiberPopup} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-8 text-gray-800">
            {/* Image */}
            <div className="mb-8 text-center">
              <Image
                src="/fiber-optic.png"
                alt="Fiber Optic Cable"
                width={800}
                height={600}
                className="mx-auto rounded-lg shadow-lg max-w-2xl"
              />
            </div>
            <div className="space-y-6">
              {/* Explanation */}
              <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is Fiber Optic Cable?
                    </h4>
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <p className="text-lg text-gray-700 leading-relaxed">
                  <strong>Fiber optic cable</strong> is a thin cable made of glass or plastic that transmits light from one end to the other. This technology is used to send data as light pulses at extremely high speeds and with very low loss.<br /><br />
                  A fiber optic cable consists of three main layers: <b>core</b> (the light-carrying center), <b>cladding</b> (the surrounding layer that reflects light back into the core), and <b>coating</b> (the protective outer layer). The working principle is <i>total internal reflection</i>, where light is continuously reflected within the core so it can travel long distances with minimal signal loss.
                </p>
              </div>
            </div>

              {/* Main Functions */}
              <div className="bg-pink-50 p-6 rounded-lg border-l-4 border-pink-400">
                <h4 className="text-xl font-semibold mb-3 text-pink-600">🔧 Main Functions</h4>
                <ul className="list-disc ml-6 text-gray-700 space-y-2">
                  <li>The primary transmission medium for high-speed internet, telephone, and TV networks</li>
                  <li>Connecting network devices such as switches, routers, and servers</li>
                  <li>Used in optical sensors, medical devices (endoscopy), and security systems</li>
                  <li>Enables long-distance data transmission with large bandwidth and extremely low electromagnetic interference</li>
                </ul>
              </div>

              {/* Characteristics */}
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                <h4 className="text-xl font-semibold mb-3 text-yellow-600">📋 Characteristics</h4>
                <ul className="list-disc ml-6 text-gray-700 space-y-2">
                  <li>Very high bandwidth and data transfer rates compared to copper cables</li>
                  <li>Immune to electromagnetic interference and radio frequency interference</li>
                  <li>Lightweight, flexible, and can be installed over long distances</li>
                  <li>Low signal attenuation, allowing for fewer repeaters in long-haul networks</li>
                  <li>Available in single-mode (for long distances) and multi-mode (for shorter distances) variants</li>
                  <li>Requires careful handling as the glass core is fragile and sensitive to bending radius</li>
                </ul>
              </div>

              {/* Role in This Topology */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in This Topology</h4>
                <p className="text-gray-700 leading-relaxed">
                  In the topology diagram, the red circle symbol represents the main fiber path that carries the light signal from the OTDR throughout the network. This main fiber optic cable ensures continuous, high-speed, and low-loss data transmission across all monitored points, supporting accurate monitoring and reliable network performance.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={closeFiberPopup} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

{/* SFP Explanation Popup */}
      {isSFPPopupOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeSFPPopup}></div>
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-400 text-white p-6 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">SFP+ (Small Form-factor Pluggable Plus)</h3>
          <button onClick={closeSFPPopup} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-8 text-gray-800">
        {/* Image */}
        <div className="mb-8 text-center">
          <Image
            src="/sfp.png"
            alt="SFP+ Module"
            width={800}
            height={600}
            className="mx-auto rounded-lg shadow-lg max-w-2xl"
          />
        </div>
        <div className="space-y-6">
          {/* Explanation */}
          <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is Small Form-factor Pluggable Plus (SFP+)?
                    </h4>
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
               <p className="text-lg text-gray-700 leading-relaxed">
                  <strong>SFP+ (Small Form-factor Pluggable Plus)</strong> is a compact, hot-pluggable optical transceiver module used in network devices such as switches, routers, and servers. SFP+ supports high-speed data transmission rates up to 10 Gbps, and even up to 16 Gbps in some models, making it ideal for modern high-performance networks.<br /><br />
                  SFP+ modules convert electrical signals into optical signals (and vice versa), enabling high-speed data transmission over both short and long distances using fiber optic cables. They are widely used in data centers, enterprise networks, and ISP backbones for their flexibility, scalability, and ease of maintenance.
                </p>
              </div>
            </div>

          {/* Main Functions */}
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
            <h4 className="text-xl font-semibold mb-3 text-blue-600">🔧 Main Functions</h4>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Connects network devices (switches, routers, servers) to fiber optic networks at high speeds (10G/16G).</li>
              <li>Supports long-distance data transmission (up to 120 km, depending on the type).</li>
              <li>Enables network upgrades and port flexibility without replacing main hardware.</li>
              <li>Allows hot-swapping and easy maintenance or replacement without shutting down devices.</li>
              <li>Used in data centers, enterprise networks, storage area networks (SANs), and ISP backbones.</li>
            </ul>
          </div>

          {/* Working Principle */}
          <div className="bg-gray-100 p-6 rounded-lg border-l-4 border-gray-500">
            <h4 className="text-xl font-semibold mb-3 text-gray-700">🏗️ Working Principle</h4>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>
                <strong>Transmission:</strong> At the transmitting end, the SFP+ module converts electrical signals into optical signals using a laser diode. The modulated optical signals are then sent through fiber optic cables.
              </li>
              <li>
                <strong>Reception:</strong> At the receiving end, the SFP+ module uses a photodiode to convert incoming optical signals back into electrical signals for processing by network devices.
              </li>
              <li>
                <strong>Modulation:</strong> SFP+ modules use advanced modulation techniques to maximize bandwidth and minimize latency, ensuring high-speed and reliable data transfer.
              </li>
              <li>
                <strong>Hot-Pluggable:</strong> SFP+ modules can be inserted or removed from a running system without interrupting network operation.
              </li>
            </ul>
          </div>

          {/* Characteristics & Advantages */}
          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
            <h4 className="text-xl font-semibold mb-3 text-yellow-700">📋 Characteristics & Advantages</h4>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Compact size, enabling high port density in network equipment.</li>
              <li>Supports both single-mode and multi-mode fiber optic cables.</li>
              <li>Energy-efficient with lower power consumption compared to older transceivers.</li>
              <li>Backward compatible with SFP slots (at reduced speeds).</li>
              <li>Industry-standard design, ensuring interoperability across vendors and devices.</li>
              <li>Cost-effective solution for scaling and upgrading network bandwidth.</li>
            </ul>
          </div>

          {/* Role in this Topology */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h4 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h4>
            <p className="text-gray-700 leading-relaxed">
              In the OptiPredict topology, the SFP+ symbol represents the termination point of active network devices that connect directly to the fiber optic network. SFP+ modules ensure reliable, high-speed data transfer between network elements, supporting monitoring, data collection, and efficient communication across the optical infrastructure.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={closeSFPPopup} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}


{/* VOA Explanation Popup */}
      {isVOAPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeVOAPopup}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Variable Optical Attenuator (VOA)</h3>
                <button onClick={closeVOAPopup} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              {/* Image */}
              <div className="mb-8 text-center">
                <Image
                  src="/voa-optic.png"
                  alt="Variable Optical Attenuator (VOA)"
                  width={800}
                  height={600}
                  className="mx-auto rounded-lg shadow-lg max-w-2xl"
                />
              </div>
              <div className="space-y-6">
                {/* Explanation */}
                 <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is Variable Optical Attenuator (VOA)?
                    </h4>
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    <strong>Variable Optical Attenuator (VOA)</strong> is a passive device in fiber optic systems that precisely controls (reduces or increases) the power of an optical signal. VOA enables operators or devices to automatically adjust optical signal strength to remain stable and meet requirements, whether for long-distance transmission, testing, or protecting sensitive receiver equipment.<br /><br />
                    VOA can use various technologies such as filters, mechanical adjustment, MEMS, or liquid crystal to set the attenuation level, either manually or electronically.
                  </p>
                </div>
                </div>

                {/* Main Functions */}
                <div className="bg-blue-100 p-6 rounded-lg border-l-4 border-blue-400">
                  <h4 className="text-xl font-semibold mb-3 text-blue-700">🔬 Main Functions & Applications</h4>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    <li>Balances signal strength between transmission and reception to prevent signals from being too strong or too weak</li>
                    <li>Protects receiver devices from excessive optical power that could cause distortion or damage</li>
                    <li>Simulates attenuation conditions for optical network testing and development</li>
                    <li>Supports dynamic adjustment in DWDM, OADM, and EDFA systems</li>
                    <li>Used for power equalization in multi-channel optical networks</li>
                  </ul>
                </div>

                {/* Working Principle & Characteristics */}
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="text-xl font-semibold mb-3 text-yellow-700">🔧 Working Principle & Characteristics</h4>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    <li>
                      <strong>Working Principle:</strong> VOA works by introducing controlled loss into the optical path. This can be done by physically blocking part of the light (mechanical/rotary type), using micro-electromechanical systems (MEMS), or by changing the refractive index (liquid crystal or filter type).
                    </li>
                    <li>
                      <strong>Manual or Automatic:</strong> Attenuation can be set manually (e.g., turning a knob) or automatically (electronically controlled) depending on the application.
                    </li>
                    <li>
                      <strong>High Precision:</strong> Allows fine adjustment of attenuation levels, typically from 0.1 dB up to 30 dB or more.
                    </li>
                    <li>
                      <strong>Low Insertion Loss:</strong> Designed to minimize additional signal loss when not attenuating.
                    </li>
                    <li>
                      <strong>Wide Compatibility:</strong> Available for both single-mode and multi-mode fiber networks.
                    </li>
                  </ul>
                </div>

                {/* Role in this Topology */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h4>
                  <p className="text-gray-700 leading-relaxed">
                    In the topology diagram, the blue circle with an arrow indicates the location of the Variable Optical Attenuator (VOA), which is used to adjust signal strength in real-time. VOA ensures that the optical power remains within safe and optimal ranges for monitoring, testing, and protecting network devices, thus supporting the reliability and flexibility of the entire optical network.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={closeVOAPopup} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Reflector Explanation Popup */}
      {isReflectorPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeReflectorPopup}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-400 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Reflector (Fiber Optic Reflector)</h3>
                <button onClick={closeReflectorPopup} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 text-gray-800">
              {/* Image */}
              <div className="mb-8 text-center">
                <Image
                  src="/reflector.png"
                  alt="Fiber Optic Reflector"
                  width={800}
                  height={600}
                  className="mx-auto rounded-lg shadow-lg max-w-2xl"
                />
              </div>
              <div className="space-y-6">
                {/* Explanation */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    What is Fiber optic reflector?
                    </h4>
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    <strong>Fiber optic reflector</strong> is a passive optical device installed at the end or at specific points in a fiber network to reflect light at a particular wavelength, usually using Fiber Bragg Grating (FBG) or special optical filters. The reflector enables real-time monitoring and detection of network conditions. When the OTDR sends a test signal, the reflector reflects the signal back to the OTDR, allowing the location of the fiber end or key points to be clearly identified in the OTDR trace.
                  </p>
                </div>
                </div>

                {/* Main Functions */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-xl font-semibold mb-3 text-blue-600">🔬 Main Functions</h4>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    <li>Provides a strong reflected signal at a specific wavelength for optical network monitoring</li>
                    <li>Enables easy detection of fiber ends or key points in the OTDR trace</li>
                    <li>Helps detect faults, breaks, or degradation in the fiber network quickly</li>
                    <li>Used in monitoring FTTx, PON, and optical distribution systems</li>
                    <li>Does not interfere with normal data transmission as it only reflects the monitoring wavelength</li>
                  </ul>
                </div>

                {/* Working Principle */}
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="text-xl font-semibold mb-3 text-yellow-700">💡 Working Principle</h4>
                  <ul className="list-disc ml-6 text-gray-700 space-y-2">
                    <li>
                      The reflector, typically using Fiber Bragg Grating (FBG), is designed to reflect only the OTDR test wavelength (e.g., 1625nm) with nearly 100% efficiency, while allowing all other wavelengths to pass through with minimal loss.
                    </li>
                    <li>
                      When the OTDR sends a test pulse, the reflector bounces the pulse back to the OTDR, creating a clear reflection peak in the OTDR trace that marks the end of the fiber or a specific monitoring point.
                    </li>
                    <li>
                      The reflected signal is analyzed to determine the link's health, detect faults, and precisely locate breaks or high-loss points in the network.
                    </li>
                    <li>
                      The reflector is transparent to normal data wavelengths, ensuring that real-time monitoring does not affect regular network traffic.
                    </li>
                  </ul>
                </div>

                {/* Role in this Topology */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="text-xl font-semibold mb-3 text-green-700">🎯 Role in this Topology</h4>
                  <p className="text-gray-700 leading-relaxed">
                    In the topology diagram, the curved arrow symbol at the right end indicates the location of the reflector, which is used for real-time monitoring and detection with the OTDR. The reflector enables accurate identification of fiber ends or key points, supports quick fault diagnosis, and enhances the reliability and maintainability of the optical network.
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={closeReflectorPopup} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-auto">
        <div className="bg-black bg-opacity-60 backdrop-blur-sm border-t border-white border-opacity-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 xl:px-24 py-8">
            <div className="text-center">
              <p className="text-gray-300">&copy; 2025 OptiPredict. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}