import { CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Import bathroom images
import basicVanityImage from "@/assets/bathroom/basic-vanity.jpg";
import upgradedVanityImage from "@/assets/bathroom/upgraded-vanity.jpg";
import customAmishVanityImage from "@/assets/bathroom/custom-amish-vanity.jpg";
import freestandingTubImage from "@/assets/bathroom/freestanding-tub.jpg";
import walkInShowerImage from "@/assets/bathroom/walk-in-shower.jpg";

// Import shower/tub images
import tubShowerComboImage from "@/assets/bathroom/tub-shower-combo.jpg";
import walkInShowerOnlyImage from "@/assets/bathroom/walk-in-shower-only.jpg";
import tiledShowerStandaloneTubImage from "@/assets/bathroom/tiled-shower-standalone-tub.jpg";
import premiumShowerBenchImage from "@/assets/bathroom/premium-shower-bench.jpg";

// Import flooring type images
import luxuryVinylImage from "@/assets/flooring/luxury-vinyl-plank.jpg";
import ceramicTileImage from "@/assets/flooring/ceramic-tile.jpg";

// Import countertop images
import quartzImage from "@/assets/countertops/quartz.jpg";
import graniteImage from "@/assets/countertops/granite.jpg";
import marbleImage from "@/assets/countertops/marble.jpg";
import butcherBlockImage from "@/assets/countertops/butcher-block.jpg";
import concreteImage from "@/assets/countertops/concrete.jpg";
import laminateImage from "@/assets/countertops/laminate.jpg";

// Import plumbing fixture images
import sinkFaucetGoodImage from "@/assets/bathroom/sink-faucet-good.jpg";
import sinkFaucetBetterImage from "@/assets/bathroom/sink-faucet-better.jpg";
import sinkFaucetBestImage from "@/assets/bathroom/sink-faucet-best.jpg";
import showerFaucetGoodImage from "@/assets/bathroom/shower-faucet-good.jpg";
import showerFaucetBetterImage from "@/assets/bathroom/shower-faucet-better.jpg";
import showerFaucetBestImage from "@/assets/bathroom/shower-faucet-best.jpg";
import showerheadGoodImage from "@/assets/bathroom/showerhead-good.jpg";
import showerheadBetterImage from "@/assets/bathroom/showerhead-better.jpg";
import showerheadBestImage from "@/assets/bathroom/showerhead-best.jpg";

interface BathroomSectionProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

export const BathroomSection = ({ selections, setSelections, isEditing }: BathroomSectionProps) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);

  const openImageModal = (src: string, title: string) => {
    setSelectedImage({ src, title });
    setImageModalOpen(true);
  };

  // Helper function to render plumbing fixtures
  const renderPlumbingFixtures = (bathPrefix: string) => (
    <>
      {/* Sink Faucet */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Sink Faucet</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              id: 'good', 
              name: 'Chrome Single Handle', 
              description: 'Chrome finish, single handle, standard style',
              image: sinkFaucetGoodImage,
              tier: 'Good'
            },
            { 
              id: 'better', 
              name: 'Brushed Nickel Widespread', 
              description: 'Brushed nickel finish, widespread handles',
              image: sinkFaucetBetterImage,
              tier: 'Better',
              isUpgrade: true
            },
            { 
              id: 'best', 
              name: 'Matte Black Waterfall', 
              description: 'Matte black finish, waterfall spout, luxury design',
              image: sinkFaucetBestImage,
              tier: 'Best',
              isUpgrade: true
            }
          ].map((faucet) => (
            <div 
              key={faucet.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_sink_faucet`] === faucet.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_sink_faucet`]: faucet.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={faucet.image} 
                  alt={faucet.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(faucet.image, faucet.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(faucet.image, faucet.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Badge variant="outline" className="absolute bottom-1 left-1 bg-white text-xs">
                  {faucet.tier}
                </Badge>
              </div>
              <h5 className="font-medium text-sm">{faucet.name}</h5>
              <p className="text-xs text-muted-foreground">{faucet.description}</p>
              {faucet.isUpgrade && (
                <Badge className="bg-yellow-400 text-black text-xs flex items-center gap-1 w-fit mt-1 px-2 py-1">
                  ⭐ Upgrade
                </Badge>
              )}
              {selections[`${bathPrefix}_sink_faucet`] === faucet.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shower/Tub Faucet */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Shower/Tub Faucet & Controls</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              id: 'good', 
              name: 'Chrome Standard', 
              description: 'Chrome finish, single handle, standard controls',
              image: showerFaucetGoodImage,
              tier: 'Good'
            },
            { 
              id: 'better', 
              name: 'Brushed Nickel with Handheld', 
              description: 'Brushed nickel finish, dual controls, handheld shower',
              image: showerFaucetBetterImage,
              tier: 'Better',
              isUpgrade: true
            },
            { 
              id: 'best', 
              name: 'Matte Black Thermostatic System', 
              description: 'Matte black finish, thermostatic controls, luxury system',
              image: showerFaucetBestImage,
              tier: 'Best',
              isUpgrade: true
            }
          ].map((faucet) => (
            <div 
              key={faucet.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_shower_faucet`] === faucet.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_shower_faucet`]: faucet.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={faucet.image} 
                  alt={faucet.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(faucet.image, faucet.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(faucet.image, faucet.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Badge variant="outline" className="absolute bottom-1 left-1 bg-white text-xs">
                  {faucet.tier}
                </Badge>
              </div>
              <h5 className="font-medium text-sm">{faucet.name}</h5>
              <p className="text-xs text-muted-foreground">{faucet.description}</p>
              {faucet.isUpgrade && (
                <Badge className="bg-yellow-400 text-black text-xs flex items-center gap-1 w-fit mt-1 px-2 py-1">
                  ⭐ Upgrade
                </Badge>
              )}
              {selections[`${bathPrefix}_shower_faucet`] === faucet.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Showerhead */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Showerhead Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              id: 'good', 
              name: 'Standard Showerhead', 
              description: 'Chrome finish, standard round design, basic spray',
              image: showerheadGoodImage,
              tier: 'Good'
            },
            { 
              id: 'better', 
              name: 'Rain Showerhead', 
              description: 'Brushed nickel finish, large square rain head',
              image: showerheadBetterImage,
              tier: 'Better',
              isUpgrade: true
            },
            { 
              id: 'best', 
              name: 'Multi-Spray System', 
              description: 'Matte black finish, multiple heads, body jets, spa experience',
              image: showerheadBestImage,
              tier: 'Best',
              isUpgrade: true
            }
          ].map((showerhead) => (
            <div 
              key={showerhead.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_showerhead`] === showerhead.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_showerhead`]: showerhead.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={showerhead.image} 
                  alt={showerhead.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(showerhead.image, showerhead.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(showerhead.image, showerhead.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Badge variant="outline" className="absolute bottom-1 left-1 bg-white text-xs">
                  {showerhead.tier}
                </Badge>
              </div>
              <h5 className="font-medium text-sm">{showerhead.name}</h5>
              <p className="text-xs text-muted-foreground">{showerhead.description}</p>
              {showerhead.isUpgrade && (
                <Badge className="bg-yellow-400 text-black text-xs flex items-center gap-1 w-fit mt-1 px-2 py-1">
                  ⭐ Upgrade
                </Badge>
              )}
              {selections[`${bathPrefix}_showerhead`] === showerhead.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderBathroomContent = (bathPrefix: string, bathTitle: string) => (
    <div className="space-y-6">
      {/* Vanity Style */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Vanity Style</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'basic', name: 'Basic Vanity', description: 'Simple design with standard features', image: basicVanityImage },
            { id: 'upgraded', name: 'Upgraded Vanity', description: 'Enhanced materials and finishes', image: upgradedVanityImage },
            { id: 'custom_amish', name: 'Custom Amish Vanity', description: 'Handcrafted custom design', image: customAmishVanityImage }
          ].map((style) => (
            <div 
              key={style.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_vanity_style`] === style.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_vanity_style`]: style.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(style.image, style.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(style.image, style.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              <h5 className="font-medium text-sm">{style.name}</h5>
              <p className="text-xs text-muted-foreground">{style.description}</p>
              {selections[`${bathPrefix}_vanity_style`] === style.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vanity Countertop */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Vanity Countertop</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'quartz', name: 'Quartz', image: quartzImage },
            { id: 'granite', name: 'Granite', image: graniteImage },
            { id: 'cultured_marble', name: 'Cultured Marble', image: marbleImage }
          ].map((countertop) => (
            <div
              key={countertop.id}
              className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_countertop`] === countertop.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_countertop`]: countertop.id });
                }
              }}
            >
              <img 
                src={countertop.image} 
                alt={countertop.name}
                className="w-full h-16 object-cover rounded-t cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  openImageModal(countertop.image, countertop.name);
                }}
              />
              <div className="p-2">
                <div className="text-xs font-medium text-center">{countertop.name}</div>
                {selections[`${bathPrefix}_countertop`] === countertop.id && (
                  <div className="text-xs text-green-600 text-center">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shower & Tub Options */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Shower & Tub Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              id: 'tub_shower_combo', 
              name: 'Tub/Shower Combo', 
              description: 'Standard bathtub with shower above',
              image: tubShowerComboImage,
              isStandard: true
            },
            { 
              id: 'walk_in_shower_only', 
              name: 'Walk-in Shower Only', 
              description: 'No tub, shower only design',
              image: walkInShowerOnlyImage,
              isUpgrade: true
            },
            { 
              id: 'tiled_shower_standalone_tub', 
              name: 'Tiled Shower + Standalone Tub', 
              description: 'Separate shower and freestanding tub',
              image: tiledShowerStandaloneTubImage,
              isUpgrade: true
            },
            { 
              id: 'premium_shower_bench', 
              name: 'Premium Shower with Bench', 
              description: 'Luxury shower with built-in seating',
              image: premiumShowerBenchImage,
              isUpgrade: true
            }
          ].map((option) => (
            <div 
              key={option.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_shower_tub`] === option.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_shower_tub`]: option.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={option.image} 
                  alt={option.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(option.image, option.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(option.image, option.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              <h5 className="font-medium text-sm">{option.name}</h5>
              <p className="text-xs text-muted-foreground">{option.description}</p>
              {option.isUpgrade && (
                <Badge className="bg-yellow-400 text-black text-xs flex items-center gap-1 w-fit mt-1 px-2 py-1">
                  ⭐ Upgrade
                </Badge>
              )}
              {selections[`${bathPrefix}_shower_tub`] === option.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Plumbing Fixtures */}
      {renderPlumbingFixtures(bathPrefix)}

      {/* Bathroom Flooring */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Bathroom Flooring</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'luxury_vinyl', name: 'Luxury Vinyl Plank', description: 'Waterproof, durable, easy maintenance', image: luxuryVinylImage },
            { id: 'ceramic_tile', name: 'Ceramic Tile', description: 'Water-resistant and durable', image: ceramicTileImage }
          ].map((flooring) => (
            <div 
              key={flooring.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                selections[`${bathPrefix}_flooring`] === flooring.id ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isEditing) {
                  setSelections({ ...selections, [`${bathPrefix}_flooring`]: flooring.id });
                }
              }}
            >
              <div className="relative mb-2">
                <img 
                  src={flooring.image} 
                  alt={flooring.name}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(flooring.image, flooring.name);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(flooring.image, flooring.name);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              <h5 className="font-medium text-sm">{flooring.name}</h5>
              <p className="text-xs text-muted-foreground">{flooring.description}</p>
              {selections[`${bathPrefix}_flooring`] === flooring.id && (
                <div className="mt-1 text-xs text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-cyan-800 mb-2">Bathroom Selections</h3>
        <p className="text-sm text-cyan-600">Design each bathroom independently to match your style</p>
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="master">Master Bathroom</TabsTrigger>
          <TabsTrigger value="bathroom2">Bathroom 2</TabsTrigger>
          <TabsTrigger value="bathroom3">Bathroom 3</TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-6 mt-6">
          {renderBathroomContent('master_bath', 'Master Bathroom')}
        </TabsContent>

        <TabsContent value="bathroom2" className="space-y-6 mt-6">
          {renderBathroomContent('bath2', 'Bathroom 2')}
        </TabsContent>

        <TabsContent value="bathroom3" className="space-y-6 mt-6">
          {renderBathroomContent('bath3', 'Bathroom 3')}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedImage && (
            <div className="relative">
              <img 
                src={selectedImage.src} 
                alt={selectedImage.title}
                className="w-full h-auto object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};