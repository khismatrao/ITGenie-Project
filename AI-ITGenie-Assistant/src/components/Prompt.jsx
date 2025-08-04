import { Send, Loader2 } from "lucide-react";
const Prompt = ({
  handleSubmit,
  setPrompt,
  prompt,
  handleKeyPress,
  isLoading,
}) => {
  return (
    <div className="mt-auto px-1 ">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative mb-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hi! What IT issue can I help you solve?"
            className="w-full p-4 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#45c4e9] focus:border-transparent min-h-[100px] max-h-[300px]"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3 text-blue-400 text-sm">
            {prompt.length}/2000
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrompt("")}
              className="px-4 py-2 text-blue-400 hover:text-blue-700 transition-colors"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-[#45c4e9] hover:bg-[#54b3a6] disabled:bg-blue-200 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={18} />
                Run Prompt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Prompt;
