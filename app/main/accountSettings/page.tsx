"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import {
  UserIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  Loader2Icon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
  LockIcon,
  SparklesIcon,
} from "lucide-react";

const API_BASE_URL = "https://ella-v1.onrender.com";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  current_level: string;
  target_level: string;
  learning_goal: string;
  gender: string;
  birth_date: string;
  study_level: string;
  study_field: number | null;
  has_taken_initial_assessment: boolean;
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function AccountSettingsPage() {
  const router = useRouter();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete Account Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Helper for Auth Header
  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 1. Fetch User Profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else if (res.status === 401) {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  // Flash Message Clear Utility
  const triggerSuccessBanner = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // 2. Handle Profile Update (PATCH)
 // Helper to convert empty strings to null for backend compatibility
const sanitize = (val: string | number | null | undefined) => 
  val === "" || val === undefined ? null : val;

const handleUpdateProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!profile) return;

  setIsSavingProfile(true);
  setProfileErrors({});
  setSuccessMessage(null);

  // Convert empty strings to null so DRF date & choice fields don't reject them
  const payload = {
    username: profile.username,
    current_level: profile.current_level,
    target_level: profile.target_level,
    learning_goal: profile.learning_goal,
    gender: sanitize(profile.gender),
    birth_date: sanitize(profile.birth_date),
    study_level: sanitize(profile.study_level),
    study_field: sanitize(profile.study_field),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });

    const responseData = await res.json();

    if (res.ok) {
      setProfile(responseData);
      triggerSuccessBanner("Profile details updated successfully!");
    } else {
      // Log the actual backend error object to see which specific field failed
      console.error("Validation failed on backend:", responseData);
      setProfileErrors(responseData);
    }
  } catch (err) {
    console.error("Failed to update profile:", err);
  } finally {
    setIsSavingProfile(false);
  }
};

  // 3. Handle Password Change (PATCH)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setSuccessMessage(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({
        confirm_password: ["Passwords do not match."],
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
        triggerSuccessBanner("Password updated successfully.");
      } else {
        setPasswordErrors(responseData);
      }
    } catch (err) {
      console.error("Failed to change password:", err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 4. Handle Delete Account (DELETE)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (res.status === 204 || res.ok) {
        localStorage.clear();
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal profile, language proficiency goals, and security options.
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={profile.avatar || ""} alt={profile.username} />
              <AvatarFallback className="bg-primary/10 font-medium text-primary">
                {profile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Global Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2Icon className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="profile" className="w-full space-y-6 min-h-[580px]">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* ================= PROFILE & GOALS TAB ================= */}
        <TabsContent value="profile" className="w-full space-y-6 focus-visible:outline-none">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Learning Level Overview Banner */}
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    Language Journey
                  </CardTitle>
                  <Badge variant={profile?.has_taken_initial_assessment ? "default" : "secondary"}>
                    {profile?.has_taken_initial_assessment
                      ? "Assessment Completed"
                      : "Assessment Pending"}
                  </Badge>
                </div>
                <CardDescription>Your current skill baseline and target level.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6 pt-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <Badge variant="outline" className="font-semibold text-sm">
                    {profile?.current_level || "A1"}
                  </Badge>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Target Goal:</span>
                  <Badge className="font-semibold text-sm bg-primary text-primary-foreground">
                    {profile?.target_level || "B2"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Details</CardTitle>
                <CardDescription>
                  Update your account details and general identification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile?.username || ""}
                      onChange={(e) =>
                        setProfile((prev) => prev && { ...prev, username: e.target.value })
                      }
                    />
                    {profileErrors.username && (
                      <p className="text-xs text-destructive">{profileErrors.username[0]}</p>
                    )}
                  </div>

                  {/* Read-Only Email */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-muted-foreground">
                        Email Address
                      </Label>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LockIcon className="h-2.5 w-2.5" /> Read-only
                      </span>
                    </div>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profile?.gender || "M"}
                      onValueChange={(val) =>
                        setProfile((prev) => prev && { ...prev, gender: val })
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Birth Date</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={profile?.birth_date || ""}
                      onChange={(e) =>
                        setProfile((prev) => prev && { ...prev, birth_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Goals & Education Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Language Goals & Background</CardTitle>
                <CardDescription>
                  Configure your targets to help the AI adapt exercises to your pace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Level */}
                  <div className="space-y-2">
                    <Label htmlFor="current_level">Current Level</Label>
                    <Select
                      value={profile?.current_level || "A1"}
                      onValueChange={(val) =>
                        setProfile((prev) => prev && { ...prev, current_level: val })
                      }
                    >
                      <SelectTrigger id="current_level">
                        <SelectValue placeholder="Select current level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Level */}
                  <div className="space-y-2">
                    <Label htmlFor="target_level">Target Level</Label>
                    <Select
                      value={profile?.target_level || "B2"}
                      onValueChange={(val) =>
                        setProfile((prev) => prev && { ...prev, target_level: val })
                      }
                    >
                      <SelectTrigger
                        id="target_level"
                        className={profileErrors.target_level ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Select target level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileErrors.target_level && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        {profileErrors.target_level[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Learning Goal */}
                <div className="space-y-2">
                  <Label htmlFor="learning_goal">Primary Motivation / Learning Goal</Label>
                  <Textarea
                    id="learning_goal"
                    rows={3}
                    placeholder="e.g. To travel abroad and conduct business meetings fluently."
                    value={profile?.learning_goal || ""}
                    onChange={(e) =>
                      setProfile((prev) => prev && { ...prev, learning_goal: e.target.value })
                    }
                  />
                  {profileErrors.learning_goal && (
                    <p className="text-xs text-destructive">{profileErrors.learning_goal[0]}</p>
                  )}
                </div>

                {/* Study Level */}
                <div className="space-y-2">
                  <Label htmlFor="study_level">Academic Background</Label>
                  <Input
                    id="study_level"
                    placeholder="e.g. BAC, Bachelor's, Master's"
                    value={profile?.study_level || ""}
                    onChange={(e) =>
                      setProfile((prev) => prev && { ...prev, study_level: e.target.value })
                    }
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ================= SECURITY & ACCOUNT TAB ================= */}
        <TabsContent value="security" className="w-full space-y-6 focus-visible:outline-none">
          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Ensure your account is protected with a strong, complex password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                {/* Old Password */}
                <div className="space-y-2">
                  <Label htmlFor="old_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="old_password"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordForm.old_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))
                      }
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOldPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.old_password && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordErrors.old_password[0]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                        }
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="text-xs text-destructive font-medium">
                        {passwordErrors.new_password[0]}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      required
                    />
                    {passwordErrors.confirm_password && (
                      <p className="text-xs text-destructive font-medium">
                        {passwordErrors.confirm_password[0]}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently remove your profile, learning history, and account data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once deleted, your account cannot be recovered. All stored vocabulary, quiz metrics, and chat histories will be erased.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-destructive/20 pt-4">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2Icon className="h-4 w-4" />
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action is permanent and cannot be undone. Type{" "}
              <strong className="text-foreground select-all font-mono">DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="font-mono"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmationText !== "DELETE" || isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              {isDeletingAccount && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}