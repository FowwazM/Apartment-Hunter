import { supabase, supabaseAdmin } from "@/lib/supabase"

export interface Tour {
  id: string
  property_name: string
  address: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  contact_name: string
  contact_phone: string
  contact_email: string
  confirmation_code: string
  notes?: string | null
  rating?: number | null
  call_id?: string | null
  created_at: string
  updated_at: string
}

export interface TourInsert {
  user_id: string
  property_name: string
  address: string
  date: string
  time: string
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  contact_name: string
  contact_phone: string
  contact_email: string
  confirmation_code: string
  notes?: string
  rating?: number
  call_id?: string
}

// Updated for Supabase schema - matches actual database columns
export interface TourData {
  id?: string
  user_id: string
  property_name: string
  address: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  contact_name: string
  contact_phone: string
  contact_email: string
  confirmation_code: string
  notes?: string | null
  rating?: number | null
  call_id?: string | null
  created_at?: string
  updated_at?: string
}

export class TourModel {
  // Create new tour
  async create(data: Omit<Partial<TourData>, 'id' | 'created_at' | 'updated_at'>): Promise<TourData> {
    // Use admin client to bypass RLS since user validation is handled in the API route
    const { data: tour, error } = await supabaseAdmin
      .from('tours')
      .insert({
        user_id: data.user_id,
        property_name: data.property_name || '',
        address: data.address || '',
        date: data.date || '',
        time: data.time || '',
        status: data.status || 'scheduled',
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        confirmation_code: data.confirmation_code || '',
        notes: data.notes,
        rating: data.rating,
        call_id: data.call_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tour:', error);
      throw new Error(`Failed to create tour: ${error.message}`);
    }

    return tour;
  }

  // Create tour with legacy interface compatibility
  async createTour(data: any): Promise<any> {
    const tourData = {
      user_id: data.user_id,
      property_name: data.property_name || '',
      address: data.address || '',
      date: data.date || '',
      time: data.time || '',
      status: data.status || 'scheduled',
      contact_name: data.contact_name || '',
      contact_phone: data.contact_phone || '',
      contact_email: data.contact_email || '',
      confirmation_code: data.confirmation_code || `TOUR-${Date.now()}`,
      notes: data.notes,
      rating: data.rating,
      call_id: data.call_id
    };

    const tour = await this.create(tourData);
    
    // Transform to legacy format
    return {
      id: tour.id,
      propertyName: tour.property_name,
      address: tour.address,
      date: tour.date,
      time: tour.time,
      status: tour.status,
      contact: {
        name: tour.contact_name,
        phone: tour.contact_phone,
        email: tour.contact_email
      },
      confirmationCode: tour.confirmation_code,
      notes: tour.notes,
      rating: tour.rating,
      callId: tour.call_id,
      created_at: tour.created_at,
      updated_at: tour.updated_at
    };
  }

  // Get all tours with legacy interface
  async getAllTours(userId: string): Promise<any[]> {
    const tours = await this.getByUserId(userId);
    console.log("Tours before transformation:", tours) // Debug log
    const transformedTours = tours.map(tour => ({
      id: tour.id,
      propertyName: tour.property_name,
      address: tour.address,
      date: tour.date,
      time: tour.time,
      status: tour.status,
      contact: {
        name: tour.contact_name,
        phone: tour.contact_phone,
        email: tour.contact_email
      },
      confirmationCode: tour.confirmation_code,
      notes: tour.notes,
      rating: tour.rating,
      callId: tour.call_id,
      created_at: tour.created_at,
      updated_at: tour.updated_at
    }));
    console.log("Tours after transformation:", transformedTours) // Debug log
    return transformedTours;
  }

  // Get tour by ID with legacy interface
  async getTourById(id: string, userId: string): Promise<any | null> {
    const tour = await this.getById(id);
    if (!tour || tour.user_id !== userId) {
      return null;
    }
    return {
      id: tour.id,
      propertyName: tour.property_name,
      address: tour.address,
      date: tour.date,
      time: tour.time,
      status: tour.status,
      contact: {
        name: tour.contact_name,
        phone: tour.contact_phone,
        email: tour.contact_email
      },
      confirmationCode: tour.confirmation_code,
      notes: tour.notes,
      rating: tour.rating,
      callId: tour.call_id,
      created_at: tour.created_at,
      updated_at: tour.updated_at
    };
  }

  // Update tour with legacy interface
  async updateTour(id: string, userId: string, updates: any): Promise<any | null> {
    const existing = await this.getById(id);
    if (!existing || existing.user_id !== userId) {
      return null;
    }

    const updateData: Partial<TourData> = {};
    if (updates.property_name) {
      updateData.property_name = updates.property_name;
    }
    if (updates.address) {
      updateData.address = updates.address;
    }
    if (updates.date) {
      updateData.date = updates.date;
    }
    if (updates.time) {
      updateData.time = updates.time;
    }
    if (updates.status) {
      updateData.status = updates.status;
    }
    if (updates.contact_name) {
      updateData.contact_name = updates.contact_name;
    }
    if (updates.contact_phone) {
      updateData.contact_phone = updates.contact_phone;
    }
    if (updates.contact_email) {
      updateData.contact_email = updates.contact_email;
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }
    if (updates.rating !== undefined) {
      updateData.rating = updates.rating;
    }

    const tour = await this.update(id, updateData);
    return {
      id: tour.id,
      propertyName: tour.property_name,
      address: tour.address,
      date: tour.date,
      time: tour.time,
      status: tour.status,
      contact: {
        name: tour.contact_name,
        phone: tour.contact_phone,
        email: tour.contact_email
      },
      confirmationCode: tour.confirmation_code,
      notes: tour.notes,
      rating: tour.rating,
      callId: tour.call_id,
      created_at: tour.created_at,
      updated_at: tour.updated_at
    };
  }

  // Delete tour with legacy interface
  async deleteTour(id: string, userId: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing || existing.user_id !== userId) {
      return false;
    }
    await this.delete(id);
    return true;
  }

  // Complete tour with legacy interface
  async completeTour(id: string, userId: string, rating: number, notes?: string): Promise<any | null> {
    return await this.updateTour(id, userId, {
      status: 'completed',
      rating,
      notes
    });
  }

  // Transform legacy format to new format
  static transformFromTourWithContact(tour: any): any {
    return {
      user_id: tour.user_id,
      property_name: tour.propertyName || tour.property_name || '',
      address: tour.address || '',
      date: tour.date || '',
      time: tour.time || '',
      status: tour.status || 'scheduled',
      contact_name: tour.contact?.name || tour.contact_name || '',
      contact_phone: tour.contact?.phone || tour.contact_phone || '',
      contact_email: tour.contact?.email || tour.contact_email || '',
      confirmation_code: tour.confirmationCode || tour.confirmation_code || `TOUR-${Date.now()}`,
      notes: tour.notes,
      rating: tour.rating,
      call_id: tour.callId || tour.call_id,
    };
  }

  // Get all tours for a user
  async getByUserId(userId: string): Promise<TourData[]> {
    console.log("Querying tours for userId:", userId) // Debug log
    
    // First, let's check total count of tours in the table
    const { count } = await supabaseAdmin
      .from('tours')
      .select('*', { count: 'exact', head: true });
    console.log("Total tours in database:", count) // Debug log
    
    const { data: tours, error } = await supabaseAdmin
      .from('tours')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tours:', error);
      throw new Error(`Failed to fetch tours: ${error.message}`);
    }

    console.log("Raw tours from database:", tours) // Debug log
    return tours || [];
  }

  // Get tour by ID
  async getById(id: string): Promise<TourData | null> {
    const { data: tour, error } = await supabaseAdmin
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Tour not found
      }
      console.error('Error fetching tour:', error);
      throw new Error(`Failed to fetch tour: ${error.message}`);
    }

    return tour;
  }

  // Update tour
  async update(id: string, data: Partial<TourData>): Promise<TourData> {
    const { data: tour, error } = await supabaseAdmin
      .from('tours')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tour:', error);
      throw new Error(`Failed to update tour: ${error.message}`);
    }

    return tour;
  }

  // Delete tour
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tours')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tour:', error);
      throw new Error(`Failed to delete tour: ${error.message}`);
    }
  }

  // Get tours by session ID
  async getBySessionId(sessionId: string): Promise<TourData[]> {
    const { data: tours, error } = await supabaseAdmin
      .from('tours')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session tours:', error);
      throw new Error(`Failed to fetch tours by session: ${error.message}`);
    }

    return tours || [];
  }

  // Get tours by call ID
  async getByCallId(callId: string): Promise<TourData[]> {
    const { data: tours, error } = await supabaseAdmin
      .from('tours')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching call tours:', error);
      throw new Error(`Failed to fetch tours by call: ${error.message}`);
    }

    return tours || [];
  }
}

// Export singleton instance
export const tourModel = new TourModel();
