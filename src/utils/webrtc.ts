export interface CameraOptions {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  audio?: boolean
}

export class WebRTCCamera {
  private stream: MediaStream | null = null

  async startCamera(options: CameraOptions = {}): Promise<MediaStream> {
    const defaultOptions: CameraOptions = {
      width: 1280,
      height: 720,
      facingMode: 'user',
      audio: true
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: finalOptions.width },
          height: { ideal: finalOptions.height },
          facingMode: finalOptions.facingMode
        },
        audio: finalOptions.audio
      })

      return this.stream
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  async switchCamera(facingMode: 'user' | 'environment'): Promise<MediaStream> {
    this.stopCamera()
    return this.startCamera({ facingMode })
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  }

  async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'audioinput')
  }
}

export const createWebRTCCamera = (): WebRTCCamera => {
  return new WebRTCCamera()
}
