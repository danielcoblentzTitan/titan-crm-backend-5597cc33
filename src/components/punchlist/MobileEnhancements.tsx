import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileEnhancementsProps {
  onLocationUpdate?: (location: { lat: number; lng: number; accuracy: number }) => void;
  onVoiceTranscription?: (text: string) => void;
  showLocationCapture?: boolean;
  showVoiceCapture?: boolean;
}

export function MobileEnhancements({
  onLocationUpdate,
  onVoiceTranscription,
  showLocationCapture = true,
  showVoiceCapture = true
}: MobileEnhancementsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Check if browser supports required features
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const supportsGeolocation = 'geolocation' in navigator;
  const supportsMediaRecorder = 'MediaRecorder' in window;

  const getCurrentLocation = async () => {
    if (!supportsGeolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not available in this browser",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setCurrentLocation(location);
      onLocationUpdate?.(location);
      
      toast({
        title: "Location captured",
        description: `Accuracy: ${Math.round(location.accuracy)}m`,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location error",
        description: "Could not get current location",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!supportsMediaRecorder) {
      toast({
        title: "Voice recording not supported",
        description: "MediaRecorder is not available in this browser",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceRecording(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording error",
        description: "Could not start voice recording",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // This would call a Supabase Edge Function for transcription
      // For now, we'll simulate the process
      const response = await fetch('/api/voice-transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      const transcribedText = result.text || 'Could not transcribe audio';
      
      setTranscriptionText(transcribedText);
      onVoiceTranscription?.(transcribedText);
      
      toast({
        title: "Voice transcribed",
        description: "Text has been added to description",
      });
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Transcription error",
        description: "Could not process voice recording",
        variant: "destructive",
      });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const formatLocation = (location: { lat: number; lng: number; accuracy: number }) => {
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              Mobile Tools
            </Badge>
            {isMobile && (
              <Badge variant="secondary" className="text-xs">
                Optimized for mobile
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location Capture */}
            {showLocationCapture && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Location
                </h4>
                
                {currentLocation && (
                  <div className="p-2 bg-white rounded border text-xs">
                    <div className="font-medium">Current Location:</div>
                    <div className="text-muted-foreground">
                      {formatLocation(currentLocation)}
                    </div>
                    <div className="text-muted-foreground">
                      Accuracy: ±{Math.round(currentLocation.accuracy)}m
                    </div>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || !supportsGeolocation}
                  className="w-full bg-white"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      {currentLocation ? 'Update Location' : 'Capture Location'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Voice to Text */}
            {showVoiceCapture && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice to Text
                </h4>
                
                {transcriptionText && (
                  <div className="p-2 bg-white rounded border text-xs">
                    <div className="font-medium">Last Transcription:</div>
                    <div className="text-muted-foreground italic">
                      "{transcriptionText}"
                    </div>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={isProcessingVoice || !supportsMediaRecorder}
                  className={`w-full bg-white ${
                    isRecording ? 'border-red-300 text-red-600' : ''
                  }`}
                >
                  {isProcessingVoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Voice Note
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Feature Support Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            {!supportsGeolocation && (
              <div className="text-orange-600">• Location services not available</div>
            )}
            {!supportsMediaRecorder && (
              <div className="text-orange-600">• Voice recording not supported</div>
            )}
            {!isMobile && (
              <div>• Some features work best on mobile devices</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}