import { ChevronDown } from "lucide-react";

export const Dropdown = ({
  isOpen,
  setIsOpen,
  value,
  children,
  icon: Icon,
}) => (
  <div className="relative">
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-gray-400" />}
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
      <ChevronDown
        size={16}
        className={`text-gray-400 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    {isOpen && (
      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto dropdown-scroll">
        {children}
      </div>
    )}
  </div>
);
