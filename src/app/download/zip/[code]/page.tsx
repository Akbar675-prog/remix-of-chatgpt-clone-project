"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, FileArchive, AlertCircle } from "lucide-react";

export default function ZipDownloadPage() {
  const params = useParams();
  const code = params.code as string;
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  useEffect(() => {
    // Auto-download when page loads
    const autoDownload = async () => {
      try {
        // Check if file exists first
        const checkResponse = await fetch(`/file/zip/${code}.zip`, {
          method: "HEAD",
        });

        if (!checkResponse.ok) {
          setFileExists(false);
          setError("File not found or has expired");
          return;
        }

        setFileExists(true);
        setDownloading(true);

        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = `/file/zip/${code}.zip`;
        link.download = `${code}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloading(false);
      } catch (err) {
        console.error("Download error:", err);
        setError("Failed to download file");
        setDownloading(false);
        setFileExists(false);
      }
    };

    if (code) {
      autoDownload();
    }
  }, [code]);

  const handleManualDownload = () => {
    const link = document.createElement("a");
    link.href = `/file/zip/${code}.zip`;
    link.download = `${code}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          {error ? (
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileArchive className="w-10 h-10 text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {downloading && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Downloading...
              </h1>
              <p className="text-muted-foreground">
                Your ZIP file is being downloaded automatically
              </p>
            </>
          )}

          {fileExists && !downloading && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Download Ready
              </h1>
              <p className="text-muted-foreground">
                Click the button below if the download didn't start automatically
              </p>
            </>
          )}

          {error && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Download Failed
              </h1>
              <p className="text-muted-foreground">{error}</p>
            </>
          )}

          {fileExists === null && !error && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Checking file...
              </h1>
              <p className="text-muted-foreground">Please wait</p>
            </>
          )}
        </div>

        {fileExists && (
          <button
            onClick={handleManualDownload}
            disabled={downloading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Download className="w-5 h-5" />
            {downloading ? "Downloading..." : "Download ZIP File"}
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          File Code: <span className="font-mono">{code}</span>
        </p>
      </div>
    </div>
  );
}
