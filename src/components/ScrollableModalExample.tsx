import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollableModal } from "@/components/ui/scrollable-modal"

export function ScrollableModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  const sampleContent = Array.from({ length: 50 }, (_, i) => (
    <div key={i} className="p-4 border rounded-lg mb-4 bg-card">
      <h3 className="font-semibold mb-2">Section {i + 1}</h3>
      <p className="text-muted-foreground">
        This is sample content for section {i + 1}. Lorem ipsum dolor sit amet, 
        consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore 
        et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
        ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
    </div>
  ))

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>
        Open Scrollable Modal
      </Button>

      <ScrollableModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Scrollable Modal Example"
        description="This modal contains a lot of content that can be scrolled through"
        maxHeight="80vh"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground mb-6">
            This modal demonstrates scrollable content. The header stays fixed 
            while the content area scrolls independently.
          </p>
          {sampleContent}
        </div>
      </ScrollableModal>
    </div>
  )
}