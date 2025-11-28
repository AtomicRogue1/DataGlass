"use client"

import React from 'react';
import "@/app/globals.css";
import FileUploader from '@/components/file-uploader';

export default function Page(){
  return (
    <div>
      <h1 className="text-center px-12 pt-20 text-m mb-4">DataGlass is your AI-powered data buddy for visualizing data. Just upload a CSV below, peek at the smart charts it suggests, and mix in your own ideas to make the perfect dashboard. Simple, fun, and useful.</h1>
      <FileUploader></FileUploader>
    </div>
  )
}