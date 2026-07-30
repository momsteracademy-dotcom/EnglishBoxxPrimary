import React, { useState } from "react";
import { SavedWorksheet } from "../types";
import { 
  History, 
  Search, 
  ChevronRight, 
  FileText,
  Calendar,
  Printer
} from "lucide-react";

interface HistorySidebarProps {
  savedWorksheets: SavedWorksheet[];
  onSelectWorksheet: (saved: SavedWorksheet) => void;
  onDeleteWorksheet: (id: string) => void;
  activeId?: string;
}

export default function HistorySidebar({ 
  savedWorksheets, 
  onSelectWorksheet, 
  onDeleteWorksheet,
  activeId 
}: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const filteredWorksheets = savedWorksheets.filter((item) => {
    const matchesSearch = 
      item.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === "all" || item.grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E1E8D8] shadow-sm text-[#3E4A2E] flex flex-col h-full space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#F4F7F2] pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-[#6B8E23]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#3E4A2E] font-friendly">Library Cabinet</h2>
        </div>
        <span className="text-xs bg-[#F0FDF4] text-[#6B8E23] border border-[#B8CC9A] font-bold px-2.5 py-0.5 rounded-full">
          {savedWorksheets.length} saved
        </span>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B8E23] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved worksheets..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E1E8D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B8E23] placeholder-gray-400 font-semibold text-[#3E4A2E]"
          />
        </div>

        {/* Grade Filter Pills */}
        <div className="flex flex-wrap gap-1">
          {["all", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                gradeFilter === g
                  ? "bg-[#6B8E23] text-white border-[#6B8E23]"
                  : "bg-white text-[#556B2F] border-[#E1E8D8] hover:bg-[#F0FDF4]"
              }`}
            >
              {g === "all" ? "All Grades" : g}
            </button>
          ))}
        </div>
      </div>

      {/* Worksheet List */}
      <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[500px] space-y-2 pr-1">
        {filteredWorksheets.length === 0 ? (
          <div className="text-center py-8 text-gray-400 space-y-1">
            <FileText className="w-8 h-8 mx-auto stroke-[1.5] text-[#8AA668]" />
            <p className="text-xs font-semibold text-[#556B2F]">No worksheets found</p>
            <p className="text-[10px] leading-relaxed max-w-xs mx-auto text-[#8AA668]">
              Save generated worksheets to build your personal printing cabinet!
            </p>
          </div>
        ) : (
          filteredWorksheets.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all duration-200 flex items-start justify-between group cursor-pointer ${
                activeId === item.id
                  ? "bg-[#F0FDF4] border-[#6B8E23] ring-1 ring-[#6B8E23] shadow-xs"
                  : "bg-white border-[#E1E8D8] hover:border-[#6B8E23]/30"
              }`}
              onClick={() => onSelectWorksheet(item)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
                  <span className="text-[9px] font-bold bg-[#6B8E23] text-white px-1.5 py-0.5 rounded font-friendly shrink-0">
                    {item.grade}
                  </span>
                  <span className="text-[9px] font-bold bg-[#F0FDF4] border border-[#E1E8D8] text-[#556B2F] px-1.5 py-0.5 rounded capitalize shrink-0">
                    {item.exerciseStyle.replace("-", " ")}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-800 truncate leading-snug group-hover:text-[#6B8E23] transition">
                  {item.data.title}
                </h3>
                <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-1">
                  <Calendar className="w-3 h-3 text-[#8AA668]" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 no-print">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWorksheet(item);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-[#379683] hover:bg-[#8EE4AF]/20 transition cursor-pointer"
                  title="Print this worksheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#6B8E23] transition" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
