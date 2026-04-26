import { useState } from "react";
import { X, Sparkles, Camera } from "lucide-react";

// Import images properly
import img1 from "../../assets/18b44e3723251e412bd0fadd217ea61051dcdfa2.png";
import img2 from "../../assets/590113ba9bb2e19a69cb0e1f3d4b2211789ff738.png";
import img3 from "../../assets/63a49be5401f5c07dc8ee76ecbfe113ae15de5c4.png";
import img4 from "../../assets/electron_malanday_campus.jpg";
import img5 from "../../assets/b16ae30d5d6d39f2bef489483d492fd75e4a3817.png";
import img6 from "../../assets/b90a269a02856b8f5b6c9cd41bf07f1c424e73b7.png";
import img7 from "../../assets/e436fd159160a21a1f7541a2f6b43cc9616733f5.png";
import img8 from "../../assets/fadfc2d28d8ed64cd497ea15bd077ecd2fef12d8.png";

export function Gallery() {
  const galleryItems = [
    {
      id: 1,
      src: img1,
      title: "Battle of the Bands Event",
      category: "Events",
    },
    {
      id: 2,
      src: img2,
      title: "Student Activity Room",
      category: "Facilities",
    },
    {
      id: 3,
      src: img3,
      title: "Cultural Dance Performance",
      category: "Events",
    },
    {
      id: 4,
      src: img4,
      title: "School Basketball Court",
      category: "Campus",
    },
    {
      id: 5,
      src: img5,
      title: "Computer School Branch",
      category: "Facilities",
    },
    {
      id: 6,
      src: img6,
      title: "Main Campus Building",
      category: "Campus",
    },
    {
      id: 7,
      src: img7,
      title: "Campus Overview",
      category: "Campus",
    },
    {
      id: 8,
      src: img8,
      title: "Student Performance",
      category: "Events",
    },
  ];

  const categories = ["All", "Campus", "Facilities", "Events"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null);

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
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-7xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-2xl font-bold mb-2">{selectedImage.title}</h3>
              <p className="text-lg text-gray-300">{selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}