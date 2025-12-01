import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { SymbolLibrary, getSymbolsByCategory } from '../symbols/SymbolLibrary';

interface FixtureItem {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  element: string;
}

interface FixtureBrowserProps {
  onFixtureSelect: (fixture: FixtureItem) => void;
  onFixtureDrag: (fixture: FixtureItem) => void;
}

export const FixtureBrowser: React.FC<FixtureBrowserProps> = ({
  onFixtureSelect,
  onFixtureDrag
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: '🏠' },
    { id: 'doors', name: 'Doors', icon: '🚪' },
    { id: 'windows', name: 'Windows', icon: '🪟' },
    { id: 'bathroom', name: 'Bath', icon: '🛁' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' }
  ];

  const getAllFixtures = (): FixtureItem[] => {
    const fixtures: FixtureItem[] = [];
    
    // Doors
    fixtures.push({
      id: 'single_door_36',
      name: 'Single Door 36"',
      category: 'doors',
      width: 36,
      height: 6,
      element: SymbolLibrary.doors.singleDoor(36, 'right').element
    });
    
    fixtures.push({
      id: 'double_door_72',
      name: 'Double Door 72"',
      category: 'doors',
      width: 72,
      height: 6,
      element: SymbolLibrary.doors.doubleDoor(72).element
    });

    fixtures.push({
      id: 'sliding_door_72',
      name: 'Sliding Door 72"',
      category: 'doors',
      width: 72,
      height: 14,
      element: SymbolLibrary.doors.slidingDoor(72).element
    });

    // Windows
    fixtures.push({
      id: 'single_window_36',
      name: 'Single Window 36"',
      category: 'windows',
      width: 36,
      height: 48,
      element: SymbolLibrary.windows.singleWindow(36, 48).element
    });

    fixtures.push({
      id: 'double_window_72',
      name: 'Double Window 72"',
      category: 'windows',
      width: 72,
      height: 48,
      element: SymbolLibrary.windows.doubleWindow(72, 48).element
    });

    // Bathroom fixtures
    const toilet = SymbolLibrary.bathroom.toilet();
    fixtures.push({
      id: 'toilet',
      name: toilet.name,
      category: 'bathroom',
      width: toilet.width,
      height: toilet.height,
      element: toilet.element
    });

    const sink = SymbolLibrary.bathroom.sink(24);
    fixtures.push({
      id: 'bathroom_sink',
      name: sink.name,
      category: 'bathroom',
      width: sink.width,
      height: sink.height,
      element: sink.element
    });

    const bathtub = SymbolLibrary.bathroom.bathtub(60, 30);
    fixtures.push({
      id: 'bathtub',
      name: bathtub.name,
      category: 'bathroom',
      width: bathtub.width,
      height: bathtub.height,
      element: bathtub.element
    });

    const shower = SymbolLibrary.bathroom.shower(36, 36);
    fixtures.push({
      id: 'shower',
      name: shower.name,
      category: 'bathroom',
      width: shower.width,
      height: shower.height,
      element: shower.element
    });

    const vanity = SymbolLibrary.bathroom.vanity(48, 22);
    fixtures.push({
      id: 'vanity',
      name: vanity.name,
      category: 'bathroom',
      width: vanity.width,
      height: vanity.height,
      element: vanity.element
    });

    // Kitchen fixtures
    const refrigerator = SymbolLibrary.kitchen.refrigerator(36, 24);
    fixtures.push({
      id: 'refrigerator',
      name: refrigerator.name,
      category: 'kitchen',
      width: refrigerator.width,
      height: refrigerator.height,
      element: refrigerator.element
    });

    const stove = SymbolLibrary.kitchen.stove(30, 24);
    fixtures.push({
      id: 'stove',
      name: stove.name,
      category: 'kitchen',
      width: stove.width,
      height: stove.height,
      element: stove.element
    });

    const dishwasher = SymbolLibrary.kitchen.dishwasher(24, 24);
    fixtures.push({
      id: 'dishwasher',
      name: dishwasher.name,
      category: 'kitchen',
      width: dishwasher.width,
      height: dishwasher.height,
      element: dishwasher.element
    });

    const kitchenSink = SymbolLibrary.kitchen.kitchenSink(33);
    fixtures.push({
      id: 'kitchen_sink',
      name: kitchenSink.name,
      category: 'kitchen',
      width: kitchenSink.width,
      height: kitchenSink.height,
      element: kitchenSink.element
    });

    // Bedroom fixtures
    const queenBed = SymbolLibrary.bedroom.bed('queen');
    fixtures.push({
      id: 'queen_bed',
      name: queenBed.name,
      category: 'bedroom',
      width: queenBed.width,
      height: queenBed.height,
      element: queenBed.element
    });

    const kingBed = SymbolLibrary.bedroom.bed('king');
    fixtures.push({
      id: 'king_bed',
      name: kingBed.name,
      category: 'bedroom',
      width: kingBed.width,
      height: kingBed.height,
      element: kingBed.element
    });

    const dresser = SymbolLibrary.bedroom.dresser(60, 20);
    fixtures.push({
      id: 'dresser',
      name: dresser.name,
      category: 'bedroom',
      width: dresser.width,
      height: dresser.height,
      element: dresser.element
    });

    const closet = SymbolLibrary.bedroom.closet(48, 24);
    fixtures.push({
      id: 'closet',
      name: closet.name,
      category: 'bedroom',
      width: closet.width,
      height: closet.height,
      element: closet.element
    });

    return fixtures;
  };

  const allFixtures = getAllFixtures();
  
  const filteredFixtures = allFixtures.filter(fixture => {
    const matchesSearch = fixture.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || fixture.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFixtureDragStart = (e: React.DragEvent, fixture: FixtureItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(fixture));
    e.dataTransfer.effectAllowed = 'copy';
    onFixtureDrag(fixture);
  };

  const FixtureCard: React.FC<{ fixture: FixtureItem }> = ({ fixture }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => handleFixtureDragStart(e, fixture)}
      onClick={() => onFixtureSelect(fixture)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{fixture.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center text-xs text-muted-foreground p-2">
          <div 
            dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 ${fixture.width} ${fixture.height}" class="w-full h-full max-w-16 max-h-16">${fixture.element}</svg>` }}
            className="w-full h-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {fixture.width}" × {fixture.height}"
          </span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Fixture Library</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fixtures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="doors" className="text-xs">Doors</TabsTrigger>
            <TabsTrigger value="windows" className="text-xs">Windows</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mt-1">
            <TabsTrigger value="bathroom" className="text-xs">Bath</TabsTrigger>
            <TabsTrigger value="kitchen" className="text-xs">Kitchen</TabsTrigger>
            <TabsTrigger value="bedroom" className="text-xs">Bedroom</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Fixture Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
          
          {filteredFixtures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No fixtures found</p>
              <p className="text-xs mt-1">Try adjusting your search or category</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Usage Instructions */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Drag & Drop:</strong> Drag fixtures to canvas</p>
          <p><strong>Click:</strong> Select and place fixture</p>
          <p><strong>Resize:</strong> Use handles to adjust size</p>
        </div>
      </div>
    </div>
  );
};