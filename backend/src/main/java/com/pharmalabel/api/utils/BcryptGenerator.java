package com.pharmalabel.api.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Hash for 'admin123': " + encoder.encode("admin123"));
        System.out.println("Hash for 'password': " + encoder.encode("password"));
    }
}
