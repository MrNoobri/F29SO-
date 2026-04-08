import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";
import { setAuthFailureCallback } from "../api/axios";
import { queryClient } from "../main";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          const response = await authAPI.getCurrentUser();
          setUser(response.data.data);
          localStorage.setItem("user", JSON.stringify(response.data.data));
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Keep the cached user - don't logout on verification failure
          // The axios interceptor will handle 401 errors properly
        }
      } else {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.data);
          localStorage.setItem("user", JSON.stringify(response.data.data));
        } catch (error) {
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    // Register callback for when the axios interceptor detects auth failure
    setAuthFailureCallback(() => {
      setUser(null);
    });

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user } = response.data.data;
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { user } = response.data.data;
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    return user;
  };

  const completeOAuthLogin = async () => {
    const response = await authAPI.getCurrentUser();
    const currentUser = response.data.data;

    localStorage.setItem("user", JSON.stringify(currentUser));
    setUser(currentUser);
    return currentUser;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      sessionStorage.removeItem("medxi_splash_shown");
      queryClient.clear();
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    completeOAuthLogin,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isPatient: user?.role === "patient",
    isProvider: user?.role === "provider",
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
