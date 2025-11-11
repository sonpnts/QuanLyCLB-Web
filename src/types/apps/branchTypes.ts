export interface BranchType {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
}

export interface GetBranchesParams {
  MinLatitude?: number
  MaxLatitude?: number
  MinLongitude?: number
  MaxLongitude?: number
  CreatedDate?: string
  CreatedBy?: string
  UpdatedDate?: string
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface CreateBranchRequest {
  name?: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
}

export interface UpdateBranchRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  allowedRadiusMeters?: number
  googleMapsEmbedUrl?: string
  isActive?: boolean
}
