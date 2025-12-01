import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface SocialImageShareProps {
  imageUrl: string;
  title?: string;
  description?: string;
}

const SocialImageShare = ({ 
  imageUrl, 
  title = "Construction Project Progress", 
  description = "Check out this amazing construction progress!" 
}: SocialImageShareProps) => {
  const [copied, setCopied] = useState(false);

  // Ensure the image URL is absolute
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
  
  const shareText = `${title} - ${description}`;

  const shareToFacebook = () => {
    // For best results on Facebook, share the direct image URL
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullImageUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    // Twitter will automatically detect and display the image when sharing the direct URL
    const twitterText = `${shareText} ${fullImageUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const copyImageUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullImageUrl);
      setCopied(true);
      toast.success("Image URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy the URL and provide instructions
    copyImageUrl();
    toast.info("Image URL copied! Open Instagram and paste the link in your story or post.");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: fullImageUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying URL
      copyImageUrl();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={shareToFacebook}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 h-8"
        title="Share on Facebook"
      >
        <Facebook className="h-3 w-3 text-blue-400" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareToTwitter}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 h-8"
        title="Share on Twitter"
      >
        <Twitter className="h-3 w-3 text-blue-400" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={copyImageUrl}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 h-8"
        title={copied ? "Copied!" : "Copy URL"}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

export default SocialImageShare;