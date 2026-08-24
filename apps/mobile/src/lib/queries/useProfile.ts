import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileFormDTO, ProfileViewDTO } from '@wandr/shared';
import { apiJson } from '../api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiJson<ProfileViewDTO>('/api/profile'),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: ProfileFormDTO) =>
      apiJson<{ ok: boolean }>('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
