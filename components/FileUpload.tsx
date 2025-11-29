"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
    onFileSelect?: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (file.type === "application/pdf") {
            setFile(file);
            if (onFileSelect) {
                onFileSelect(file);
            }
        } else {
            alert("Please upload a PDF file.");
        }
    };

    const removeFile = () => {
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out ${dragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleChange}
                />

                {file ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm w-full sm:w-auto">
                            <div className="p-2 bg-red-50 rounded-lg shrink-0">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 text-gray-400 hover:text-red-500 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile();
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button onClick={() => onFileSelect && onFileSelect(file)} className="w-full sm:w-auto">
                            Analyze Bill
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF files only (max. 10MB)
                            </p>
                        </div>
                        <Button variant="outline" onClick={onButtonClick}>
                            Select File
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
