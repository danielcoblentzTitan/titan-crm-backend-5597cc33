import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProductType = 'metal_colors' | 'entry_doors' | 'interior_doors' | 'flooring' | 'cabinets' | 'tile' | 'fixtures';

export const ProductImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [productType, setProductType] = useState<ProductType>('metal_colors');
  const [productId, setProductId] = useState("");
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !productId) {
      toast({
        title: "Error",
        description: "Please select a product and file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${productType}/${productId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Update product table with image URL
      const tableMap: Record<string, string> = {
        metal_colors: 'metal_color_products',
        entry_doors: 'door_products',
        interior_doors: 'door_products',
        flooring: 'flooring_products',
        cabinets: 'cabinet_products',
        tile: 'tile_products',
        fixtures: 'fixture_products'
      };

      const { error: updateError } = await supabase
        .from(tableMap[productType] as any)
        .update({ image_url: data.publicUrl })
        .eq('id', productId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });

      setProductId("");
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of Array.from(files)) {
        try {
          // Extract product info from filename (format: productType_productId.ext)
          const fileName = file.name.split('.')[0];
          const [type, id] = fileName.split('_');
          
          if (!type || !id) {
            console.warn(`Skipping ${file.name}: Invalid filename format`);
            errorCount++;
            continue;
          }

          const fileExt = file.name.split('.').pop();
          const storagePath = `${type}/${id}.${fileExt}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(storagePath);

          // Update product table
          const tableMap: Record<string, string> = {
            metal: 'metal_color_products',
            entry: 'door_products',
            interior: 'door_products',
            flooring: 'flooring_products',
            cabinet: 'cabinet_products',
            tile: 'tile_products',
            fixture: 'fixture_products'
          };

          const tableName = tableMap[type];
          if (tableName) {
            await supabase
              .from(tableName as any)
              .update({ image_url: data.publicUrl })
              .eq('id', id);
          }

          successCount++;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          errorCount++;
        }
      }

      toast({
        title: "Bulk Upload Complete",
        description: `${successCount} uploaded, ${errorCount} failed`
      });

      event.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Image Uploader</CardTitle>
        <CardDescription>
          Upload images for your product catalogs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">Single Upload</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metal_colors">Metal Colors</SelectItem>
                  <SelectItem value="entry_doors">Entry Doors</SelectItem>
                  <SelectItem value="interior_doors">Interior Doors</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="cabinets">Cabinets</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="fixtures">Fixtures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product ID</Label>
              <Input
                placeholder="Enter product ID from database"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Image File</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || !productId}
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Bulk Upload Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Name files as: <code>type_productId.ext</code></li>
                <li>Example: <code>metal_abc123.jpg</code></li>
                <li>Types: metal, entry, interior, flooring, cabinet, tile, fixture</li>
                <li>Select multiple files at once</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label>Select Multiple Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBulkUpload}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing bulk upload...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
