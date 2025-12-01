import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, RotateCw, FlipHorizontal, Move, Trash2 } from 'lucide-react';
import { Module, ModuleVariant } from '../data/ModuleLibrary';

interface ModuleVariantPanelProps {
  selectedModule: Module | null;
  selectedVariant: string | null;
  onVariantSelect: (variantId: string) => void;
  onModuleRotate: () => void;
  onModuleFlip: () => void;
  onModuleMove: () => void;
  onModuleDelete: () => void;
  onClose: () => void;
}

export const ModuleVariantPanel: React.FC<ModuleVariantPanelProps> = ({
  selectedModule,
  selectedVariant,
  onVariantSelect,
  onModuleRotate,
  onModuleFlip,
  onModuleMove,
  onModuleDelete,
  onClose
}) => {
  if (!selectedModule) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No module selected</p>
          <p className="text-xs mt-1">Select a module to see variants and options</p>
        </div>
      </div>
    );
  }

  const VariantCard: React.FC<{ variant: ModuleVariant; isSelected: boolean }> = ({ 
    variant, 
    isSelected 
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md'
      }`}
      onClick={() => onVariantSelect(variant.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{variant.name}</CardTitle>
          {isSelected && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-2">
          {variant.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {variant.fixtures.length} fixtures
          </span>
          {variant.requiredSpace && (
            <Badge variant="outline" className="text-xs">
              {variant.requiredSpace.width}" × {variant.requiredSpace.height}"
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Module Options</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        
        {/* Selected Module Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{selectedModule.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {selectedModule.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedModule.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{selectedModule.dimensions.width}" × {selectedModule.dimensions.height}"</span>
            <span>{selectedModule.fixtures.length} fixtures</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Module Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Module Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onModuleRotate}
                className="flex items-center gap-2"
              >
                <RotateCw className="h-3 w-3" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onModuleFlip}
                className="flex items-center gap-2"
              >
                <FlipHorizontal className="h-3 w-3" />
                Flip
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onModuleMove}
                className="flex items-center gap-2"
              >
                <Move className="h-3 w-3" />
                Move
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onModuleDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>

          <Separator />

          {/* Variants */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Variants ({selectedModule.variants.length})
            </h4>
            
            {selectedModule.variants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No variants available</p>
                <p className="text-xs mt-1">This module has a single configuration</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Original/Default variant */}
                <VariantCard
                  variant={{
                    id: 'default',
                    name: 'Original',
                    description: 'Default module configuration',
                    fixtures: selectedModule.fixtures
                  }}
                  isSelected={selectedVariant === 'default' || selectedVariant === null}
                />
                
                {/* Custom variants */}
                {selectedModule.variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    isSelected={selectedVariant === variant.id}
                  />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Fixtures List */}
          <div>
            <h4 className="text-sm font-medium mb-3">Fixtures</h4>
            <div className="space-y-2">
              {selectedModule.fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">{fixture.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {fixture.dimensions.width}" × {fixture.dimensions.height}"
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {fixture.symbol.split('_')[0]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Clearance Rules */}
          {selectedModule.clearances.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Clearance Rules</h4>
                <div className="space-y-2">
                  {selectedModule.clearances.map((rule, index) => (
                    <div
                      key={index}
                      className="p-2 bg-muted/30 rounded-md"
                    >
                      <p className="text-xs">
                        <strong>{rule.fromFixture}</strong> to <strong>{rule.toFixture}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min. {rule.minimumDistance}" {rule.direction && `(${rule.direction})`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};