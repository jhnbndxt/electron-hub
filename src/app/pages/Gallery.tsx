import { useEffect, useState } from "react";
import { X, Camera } from "lucide-react";

import battleOfTheBands from "../../assets/battle-of-the-bands.png";
import campusMain from "../../assets/campus-main.png";
import campusOverview from "../../assets/campush-overview.jpg";
import computerSchool from "../../assets/computer-school.png";
import culturalDance from "../../assets/cultural-dance.png";
import schoolBasketballCourt from "../../assets/school-bassketball-court.png";
import studentActivityRoom from "../../assets/student-activity-room.png";
import studentPerformance from "../../assets/b16ae30d5d6d39f2bef489483d492fd75e4a3817.png";

export function Gallery() {
  const galleryItems = [
    {
      id: 1,
      src: battleOfTheBands,
      title: "Battle of the Bands Event",
      category: "Events",
    },
    {
      id: 2,
      src: studentActivityRoom,
      title: "Student Activity Room",
      category: "Facilities",
    },
    {
      id: 3,
      src: culturalDance,
      title: "Cultural Dance Performance",
      category: "Events",
    },
    {
      id: 4,
      src: schoolBasketballCourt,
      title: "School Basketball Court",
      category: "Campus",
    },
    {
      id: 5,
      src: computerSchool,
      title: "Computer School Branch",
      category: "Facilities",
    },
    {
      id: 6,
      src: campusMain,
      title: "Main Campus Building",
      category: "Campus",
    },
    {
      id: 7,
      src: campusOverview,
      title: "Campus Overview",
      category: "Campus",
    },
    {
      id: 8,
      src: studentPerformance,
      title: "Student Performance",
      category: "Events",
    },
  ];

  const categories = ["All", "Campus", "Facilities", "Events"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  const filteredItems =
    selectedCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  return (
    <div>
      {/* Hero Section with Gradient */}
      <section
        className="relative text-white py-32 overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <Camera className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">Campus Life & Events</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Gallery
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light">
            Explore our campus facilities, events, and student life at Electron College
          </p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-16 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  selectedCategory === category
                    ? "text-white scale-105"
                    : "bg-white border-2 hover:bg-gray-50"
                }`}
                style={
                  selectedCategory === category
                    ? { backgroundColor: "#B91C1C" }
                    : { borderColor: "#1E3A8A", color: "#1E3A8A" }
                }
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                onClick={() => setSelectedImage({ src: item.src, title: item.title, category: item.category })}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 text-white w-full">
                    <h3 className="text-xl mb-2 font-bold">{item.title}</h3>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "#B91C1C" }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Popup */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${selectedImage.title}`}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/95 p-2 text-slate-800 shadow-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setSelectedImage(null)}
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-slate-950 p-3 sm:p-4">
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="mx-auto max-h-[75vh] w-full rounded-2xl bg-slate-900 object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-slate-900">{selectedImage.title}</h3>
              <span
                className="w-fit rounded-full px-3 py-1 text-sm font-semibold text-white"
                style={{ backgroundColor: "#B91C1C" }}
              >
                {selectedImage.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
