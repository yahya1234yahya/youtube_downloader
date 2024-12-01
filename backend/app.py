from flask import Flask, request, jsonify, send_file
import os
import re
import logging
from flask_cors import CORS
import yt_dlp
import moviepy.editor
import time

app = Flask(__name__)
CORS(app)
DOWNLOAD_FOLDER = "downloads"

# Configure logging
logging.basicConfig(level=logging.DEBUG)

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def download_video(url, format_type):
    try:
        ydl_opts = {
            'format': 'bestaudio/best' if format_type == 'mp3' else 'bestvideo+bestaudio/best',
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }] if format_type == 'mp3' else [],
            'noprogress': True,
            'concurrent_fragment_downloads': 1,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            video_title = sanitize_filename(info_dict.get('title', 'unknown'))
            file_path = os.path.join(DOWNLOAD_FOLDER, f"{video_title}.{format_type}")
            
            # Retry mechanism for file rename
            for _ in range(3):
                try:
                    if os.path.exists(file_path):
                        return {"success": True, "file": file_path, "message": f"{format_type.upper()} downloaded successfully"}
                except PermissionError:
                    logging.warning("File is being used by another process, retrying...")
                    time.sleep(1)

            # If file doesn't exist after retries
            return {"success": False, "error": "File not found after download attempts."}

    except Exception as e:
        logging.error("Error during download with yt-dlp", exc_info=True)
        return {"success": False, "error": str(e)}

def download_playlist(url, format_type):
    try:
        ydl_opts = {
            'format': 'bestaudio/best' if format_type == 'mp3' else 'bestvideo+bestaudio/best',
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }] if format_type == 'mp3' else [],
            'noprogress': True,  # Disable progress bar
            'concurrent_fragment_downloads': 1,  # Avoid multiple writes
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            video_title = sanitize_filename(info_dict.get('title', 'unknown'))
            file_path = os.path.join(DOWNLOAD_FOLDER, f"{video_title}.{format_type}")
            return {"success": True, "file": file_path, "message": f"{format_type.upper()} downloaded successfully"}

    except Exception as e:
        logging.error("Error downloading playlist with yt-dlp", exc_info=True)
        return {"success": False, "error": str(e)}

@app.route('/api/download', methods=['POST'])
def download():
    data = request.get_json()
    url = data.get('url')
    format_type = data.get('format')
    
    if not url or not format_type:
        return jsonify({"success": False, "error": "Missing URL or format type"})
    
    try:
        if "playlist" in url:
            result = download_playlist(url, format_type)
        else:
            result = download_video(url, format_type)
            
        if result["success"]:
            return send_file(result["file"], as_attachment=True)
        else:
            return jsonify(result)
                
    except Exception as e:
        logging.error("Error downloading video or playlist", exc_info=True)
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
