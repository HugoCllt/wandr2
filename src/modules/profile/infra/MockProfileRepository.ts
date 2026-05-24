import type { IProfileRepository, ProfileView } from '../domain/IProfileRepository';

export class MockProfileRepository implements IProfileRepository {
  async getProfileView(userId: string): Promise<ProfileView> {
    return {
      profile: {
        id: userId,
        name: 'Étienne Lavoie',
        vibe: '"Always one plan ahead — somewhere between a rink and a rooftop."',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
        tags: [
          { label: 'Sport-driven', kind: 'warm' },
          { label: 'Old Montreal regular', kind: 'cool' },
          { label: 'Foodie · curious', kind: '' },
        ],
      },
      stats: [
        { label: 'Activities', value: '47', foot: '+8 this month', footKind: 'up' },
        { label: 'Saved', value: '23', foot: 'Across 6 lists', footKind: '' },
        { label: 'Top Category', value: 'Sport', foot: '32% of plans', footKind: 'warm' },
        { label: 'Outings / mo', value: '12', foot: '+3 vs last', footKind: 'up' },
        { label: 'Trend Score', value: '84', foot: 'Top 12% in MTL', footKind: 'warm' },
      ],
      breakdown: [
        { name: 'Sport', iconKey: 'ball', percent: 32 },
        { name: 'Romantic', iconKey: 'heart', percent: 18 },
        { name: 'Dining', iconKey: 'fork', percent: 22, cool: true },
        { name: 'Cultural', iconKey: 'culture', percent: 14, cool: true },
        { name: 'Outdoor', iconKey: 'mountain', percent: 14 },
      ],
      history: [
        {
          id: '1',
          title: 'Canadiens vs Bruins',
          meta: 'Bell Centre',
          date: 'May 04',
          status: 'went',
          imageUrl:
            'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: '2',
          title: 'Rooftop Fridays',
          meta: 'Terrasse Nelligan',
          date: 'Apr 28',
          status: 'went',
          imageUrl:
            'https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: '3',
          title: 'Sunrise Yoga at Mont-Royal',
          meta: 'Léa Bélanger',
          date: 'May 11',
          status: 'saved',
          imageUrl:
            'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: '4',
          title: 'F1 Canadian Grand Prix',
          meta: 'Circuit Gilles-Villeneuve',
          date: 'Jun 08',
          status: 'upcoming',
          imageUrl:
            'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80',
        },
      ],
    };
  }
}
