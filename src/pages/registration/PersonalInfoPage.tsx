import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, MapPin, Briefcase, GraduationCap, Languages, Camera, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRegistrationDraft } from '@/hooks/useRegistrationDraft';
import { supabase } from '@/lib/supabase';
import { KENYAN_COUNTIES, GENDERS, EDUCATION_LEVELS, LANGUAGES } from '@/lib/constants';
import { Card, CardHeader } from '@/components/ui/Card';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  date_of_birth: z.string().min(1, 'Please enter your date of birth'),
  gender: z.string().min(1, 'Please select your gender'),
  county: z.string().min(1, 'Please select your county'),
  sub_county: z.string().min(1, 'Please enter your sub county'),
  occupation: z.string().min(1, 'Please enter your occupation'),
  education: z.string().min(1, 'Please select your education level'),
  bio: z.string().min(20, 'Please write a short bio (at least 20 characters)').max(500, 'Bio is too long (max 500 characters)'),
});

type FormData = z.infer<typeof schema>;

export default function PersonalInfoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { draft, save } = useRegistrationDraft();
  const [languages, setLanguages] = useState<string[]>(draft.personalInfo.languages ?? []);
  const [photoUrl, setPhotoUrl] = useState<string | null>(draft.personalInfo.profile_photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: draft.personalInfo as Partial<FormData>,
  });

  useEffect(() => {
    // Load existing personal info from DB if present
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        reset({
          date_of_birth: data.date_of_birth ?? '',
          gender: data.gender ?? '',
          county: data.county ?? '',
          sub_county: data.sub_county ?? '',
          occupation: data.occupation ?? '',
          education: data.education ?? '',
          bio: data.bio ?? '',
        });
        setLanguages(data.languages ?? []);
        setPhotoUrl(data.profile_photo ?? null);
      }
      setLoading(false);
    })();
  }, [user, reset]);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('Photo must be smaller than 2MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/profile.${ext}`;
      await supabase.storage.from('profile-photos').remove([path]).catch(() => {});
      const { error: upErr } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
      toast('Photo uploaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    if (languages.length === 0) {
      toast('Please select at least one language you speak', 'error');
      return;
    }
    try {
      const payload = { ...data, languages, profile_photo: photoUrl, user_id: user.id };
      const { data: existing } = await supabase
        .from('personal_info')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        await supabase.from('personal_info').update(payload).eq('user_id', user.id);
      } else {
        await supabase.from('personal_info').insert(payload);
      }
      save({ personalInfo: { ...payload, languages, profile_photo: photoUrl } });
      toast('Personal information saved', 'success');
      navigate('/register/withdrawal');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Personal information"
        subtitle="Tell us about yourself. This helps us match you with the right opportunities."
        icon={<User className="w-5 h-5" />}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                <Camera className="w-7 h-7" />
              </div>
            )}
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error-600 text-white flex items-center justify-center shadow-sm"
                aria-label="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <span className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gray-100 text-sm font-semibold text-ink hover:bg-gray-200 transition-colors">
                <Camera className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload photo'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1.5">Optional. JPG or PNG, max 2MB.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Date of birth"
            type="date"
            leftIcon={<Calendar className="w-5 h-5" />}
            required
            {...register('date_of_birth')}
            error={errors.date_of_birth?.message}
          />
          <Select
            label="Gender"
            placeholder="Select gender"
            options={GENDERS.map((g) => ({ value: g, label: g }))}
            required
            {...register('gender')}
            error={errors.gender?.message}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="County"
            placeholder="Select county"
            options={KENYAN_COUNTIES.map((c) => ({ value: c, label: c }))}
            required
            {...register('county')}
            error={errors.county?.message}
          />
          <Input
            label="Sub county"
            placeholder="e.g. Westlands"
            leftIcon={<MapPin className="w-5 h-5" />}
            required
            {...register('sub_county')}
            error={errors.sub_county?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Languages spoken <span className="text-error-600">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const active = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-600 text-white border border-primary-600'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  {lang}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" /> Select all languages you can speak fluently.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Occupation"
            placeholder="e.g. Student, Teacher, Trader"
            leftIcon={<Briefcase className="w-5 h-5" />}
            required
            {...register('occupation')}
            error={errors.occupation?.message}
          />
          <Select
            label="Education level"
            placeholder="Select level"
            options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
            required
            {...register('education')}
            error={errors.education?.message}
          />
        </div>

        <Textarea
          label="Short bio"
          placeholder="Tell us a bit about yourself — your experience, interests, and why you'd like to join."
          rows={4}
          leftIcon={<GraduationCap className="w-5 h-5" />}
          required
          {...register('bio')}
          error={errors.bio?.message}
          hint="Between 20 and 500 characters."
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
            Back
          </Button>
          <Button type="submit" fullWidth className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}
