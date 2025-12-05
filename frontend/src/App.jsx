// frontend/src/App.jsx
import { useState } from "react";
import axios from "axios";
import { Loader2, Sparkles, Download, Copy } from "lucide-react";

function App() {
  const [url, setUrl] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setFlashcards([]);

    try {
      const formData = new FormData();
      formData.append("url", url);

      const res = await axios.post("http://localhost:8000/generate", formData);
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      setError("Backend error – check terminal. Common: missing GROQ_API_KEY or yt-dlp issue");
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const exportCSV = () => {
    const csv = flashcards
      .map((card, i) => `${i + 1},"${card.front}","${card.back}"`)
      .join("\n");
    const blob = new Blob([`Front,Back\n${csv}`], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "flashcards.csv";
    link.click();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-12 h-12 text-purple-600" />
              AI Flashcard Generator
            </h1>
            <p className="text-xl text-gray-600">
              Paste any YouTube video or article → get perfect flashcards instantly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex gap-4 max-w-3xl mx-auto">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or any article URL"
                className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="text-center text-red-600 font-medium text-lg mb-8">
              {error}
            </div>
          )}

          {flashcards.length > 0 && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                {flashcards.length} Flashcards Ready
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={exportCSV}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Copy to Clipboard (soon)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((card, index) => (
              <div
                key={index}
                onClick={() => toggleFlip(index)}
                className="relative h-64 cursor-pointer preserve-3d transition-all duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped[index] ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">Q</p>
                    <p className="text-lg mt-4 text-gray-700">{card.front}</p>
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 flex items-center justify-center text-center rotate-y-180">
                  <div>
                    <p className="text-2xl font-bold text-white">A</p>
                    <p className="text-lg mt-4 text-white">{card.back}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {flashcards.length > 0 && (
            <div className="text-center mt-12 text-gray-500">
              Click any card to flip • Export and import into Anki/Quizlet
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </>
  );
}

export default App;