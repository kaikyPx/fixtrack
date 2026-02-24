
import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, File, Video, Image as ImageIcon } from 'lucide-react';
import { uploadApi } from '../services/api';

interface FileUploaderProps {
    label: string;
    accept?: string;
    multiple?: boolean;
    onUploadComplete: (urls: string | string[]) => void;
    maxFiles?: number;
    type?: 'video' | 'image' | 'document' | 'any';
}

interface UploadStatus {
    fileName: string;
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    url?: string;
    error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
    label,
    accept,
    multiple = false,
    onUploadComplete,
    maxFiles,
    type = 'any'
}) => {
    const [uploads, setUploads] = useState<UploadStatus[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const fileList = Array.from(selectedFiles) as File[];

        // If not multiple, clear previous uploads
        if (!multiple) {
            setUploads([]);
        }

        const newUploads: UploadStatus[] = fileList.map((file: File) => ({
            fileName: file.name,
            status: 'uploading',
            progress: 0
        }));

        setUploads(prev => multiple ? [...prev, ...newUploads] : newUploads);

        if (multiple) {
            try {
                const response = await uploadApi.uploadMultiple(fileList);
                const urls = response.files.map(f => f.path);

                setUploads(prev => {
                    const updated = [...prev];
                    fileList.forEach((file: File, index: number) => {
                        const uploadIndex = updated.findIndex(u => u.fileName === file.name && u.status === 'uploading');
                        if (uploadIndex !== -1) {
                            updated[uploadIndex] = {
                                ...updated[uploadIndex],
                                status: 'success',
                                progress: 100,
                                url: response.files[index].path
                            };
                        }
                    });
                    return updated;
                });

                onUploadComplete(urls);
            } catch (err) {
                setUploads(prev => prev.map(u =>
                    u.status === 'uploading' ? { ...u, status: 'error', error: 'Erro no upload' } : u
                ));
            }
        } else {
            const file = fileList[0];
            try {
                const response = await uploadApi.uploadFile(file);
                setUploads([{
                    fileName: file.name,
                    status: 'success',
                    progress: 100,
                    url: response.path
                }]);
                onUploadComplete(response.path);
            } catch (err) {
                setUploads([{
                    fileName: file.name,
                    status: 'error',
                    error: 'Erro no upload',
                    progress: 0
                }]);
            }
        }
    };

    const removeUpload = (index: number) => {
        const newUploads = [...uploads];
        newUploads.splice(index, 1);
        setUploads(newUploads);

        if (multiple) {
            onUploadComplete(newUploads.filter(u => u.url).map(u => u.url!));
        } else {
            onUploadComplete('');
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'video': return <Video size={20} />;
            case 'image': return <ImageIcon size={20} />;
            default: return <Upload size={20} />;
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                {label}
            </label>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 mb-2 transition-all">
                    {getIcon()}
                </div>
                <p className="text-sm font-medium text-slate-600">
                    Clique para selecionar {multiple ? 'arquivos' : 'um arquivo'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {accept ? `Aceita: ${accept}` : 'Qualquer tipo de arquivo'}
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                />
            </div>

            {uploads.length > 0 && (
                <div className="space-y-2">
                    {uploads.map((upload, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-view-enter-active">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className={`p-2 rounded-lg ${upload.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                    upload.status === 'error' ? 'bg-rose-50 text-rose-600' :
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                    {upload.status === 'success' ? <CheckCircle2 size={16} /> :
                                        upload.status === 'error' ? <AlertCircle size={16} /> :
                                            <File size={16} className="animate-pulse" />}
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-bold text-slate-700 truncate">{upload.fileName}</p>
                                    {upload.status === 'uploading' && (
                                        <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-blue-500 animate-[progress_1s_ease-in-out_infinite]" style={{ width: '50%' }} />
                                        </div>
                                    )}
                                    {upload.error && <p className="text-[10px] text-rose-500 font-bold">{upload.error}</p>}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeUpload(idx);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
