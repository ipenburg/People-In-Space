#!/usr/bin/env perl
# -*- cperl; cperl-indent-level: 4 -*-
use strict;
use warnings;
use charnames qw(:full);

use utf8;
use 5.008000;

our $VERSION = '0.01';

use Archive::Zip qw( :ERROR_CODES :CONSTANTS );
use DateTime::Format::W3CDTF;
use Date::Format;
use Encode;
use English qw(-no_match_vars);
use File::Basename;
use File::Find;
use File::HomeDir;
use File::Slurp;
use File::Spec;
use Getopt::ArgvFile justload => 1;
use Getopt::Long;
use IO::File;
use IPC::Cmd;
use List::Util;
use Log::Log4perl qw(:easy get_logger);
use Pod::Usage;
use Regexp::Common qw(URI);
use Set::Scalar;
use URI::Escape;

use Readonly ();
Readonly::Scalar my $EMPTY      => q{};
Readonly::Scalar my $NEWLINE    => qq{\n};
Readonly::Scalar my $ESCAPE     => qq{\N{PERCENT SIGN}};
Readonly::Scalar my $UNDERSCORE => qq{\N{LOW LINE}};

Readonly::Scalar my $LABEL => q{People in Space};
Readonly::Scalar my $BUNDLEVERSION => time2str( q{1.6.1.%Y.%m.%d}, time );
Readonly::Scalar my $IDENTIFIER => q{nl.xs4all.ipenburg.widget.people-in-space};
Readonly::Scalar my $WIDGET_EXT => q{.wgt};
Readonly::Scalar my $WOOKIE_WIDGET_EXT => q{.zip};
Readonly::Scalar my $OSX_WIDGET_EXT    => q{.wdgt};
Readonly::Scalar my $WRT_WIDGET_EXT    => q{.wgz};
Readonly::Scalar my $ZIP_EXT           => q{.zip};
Readonly::Scalar my $SIG_EXT           => q{.sig};
Readonly::Scalar my $WIDGET_PATH       => q{widget};
Readonly::Scalar my $CONFIG            => q{config.xml};
Readonly::Scalar my $INFO              => q{Info.plist};
Readonly::Scalar my $WRT_INFO          => q{info_wrt.plist};
Readonly::Scalar my $INDEX             => q{index.html};
Readonly::Scalar my $RE_REVISION       => qr{(<revised>)[^<]+(</revised>)};
Readonly::Scalar my $RE_DEWOOKIE_NAME => qr{(<name>)[^<]+(</name>)};
Readonly::Scalar my $RE_DEWOOKIE_AUTHOR => qr{(<author>)[^<]+(</author>)};
Readonly::Scalar my $RE_DEWOOKIE_LICENSE => qr{(<license>)[^<]+(</license>)};
Readonly::Scalar my $RE_DEWOOKIE_ACCESS => qr{(<access\ [^>]+/>)};
Readonly::Scalar my $RE_DEWOOKIE_ICON => qr{(<icon\ src=[^>]+/>)};
Readonly::Scalar my $RE_DEWOOKIE_NS => qr{\ xmlns="http://www.w3.org/ns/widgets"};
Readonly::Scalar my $RE_DEWOOKIE_ID => qr{\ id="[^"]+"};
Readonly::Scalar my $RE_APPLE => qr{<script[^>]+AppleClasses[^>]+></script>\n};

Readonly::Scalar my $WGT_ZIP_EXCLUDE => qr{(
	\.(DS_Store|svn) |
	.*\.plist |
	(Default|Icon|.*_flipped)\.png |
	dashboard\.css |
	AppleClasses
)}x;

Readonly::Scalar my $WDGT_ZIP_EXCLUDE => qr{(
	\.(DS_Store|svn) |
	(icon_(16|32|64|128))\.png |
	opera\.css |
	config\.xml
)}x;

Readonly::Scalar my $WGZ_ZIP_EXCLUDE => qr{(
	\.(DS_Store|svn) |
	(Default|icon_\d+)\.png |
	dashboard\.css |
	config\.xml |
	AppleClasses |
	version\.plist
)}x;

Readonly::Scalar my $ALL => q{.*};

Readonly::Scalar my $ENCODING       => q{utf8};
Readonly::Scalar my $ERR_MODE_SLURP => q{quiet};

Readonly::Array my @DEBUG_LEVELS => ( $FATAL, $INFO, $WARN, $DEBUG );
Readonly::Array my @GETOPTIONS => ( q{help|h}, q{verbose|v+}, q{fast|f!} );
Readonly::Array my @GNUPG   => qw(/opt/local/bin/gpg -b);
Readonly::Array my @CPR     => qw(/bin/cp -r);
Readonly::Array my @RM      => qw(/bin/rm);
Readonly::Array my @MV      => qw(/bin/mv);
Readonly::Array my @YUICOMP => qw(
  java -jar /Applications/yuicompressor-2.4.7.jar -o);

Readonly::Hash my %OPTS_DEFAULT => ();

Readonly::Hash my %CFBUNDLE => (
    CFBundleDisplayName => $LABEL,
    CFBundleIdentifier  => $IDENTIFIER,
    CFBundleName        => $LABEL,
    CFBundleVersion     => $BUNDLEVERSION,
);

my @option_files;
my %opts_file = %OPTS_DEFAULT;
my %opts      = %OPTS_DEFAULT;
Getopt::Long::GetOptionsFromArray( \@option_files, \%opts_file, @GETOPTIONS );

sub wanted {
    /\.(js|css)$/gismx
      && !m{/(AppleClasses|scripts/lib)/}
      && ( $opts{fast}
        || system( @YUICOMP, $File::Find::name, $File::Find::name ) );
}

Log::Log4perl::easy_init($ERROR);
my $log = Log::Log4perl->get_logger( File::Basename::basename $PROGRAM_NAME );
$log->level( $DEBUG_LEVELS[ $opts{verbose} || 0 ] );

my $stamp = DateTime::Format::W3CDTF->new()->format_datetime( DateTime->now );
my $config =
  File::Slurp::read_file( File::Spec->catfile( $WIDGET_PATH, $CONFIG ),
    err_mode => $ERR_MODE_SLURP );
$config =~ s{$RE_REVISION}{$1$stamp$2}gismx;
File::Slurp::write_file( File::Spec->catfile( $WIDGET_PATH, $CONFIG ),
    $config );

my $info = File::Slurp::read_file( File::Spec->catfile( $WIDGET_PATH, $INFO ),
    err_mode => $ERR_MODE_SLURP );
while ( my ( $key => $string ) = each %CFBUNDLE ) {
    $info =~ s{(<key>$key</key>\s*<string>)[^<]+(</string>)}{$1$string$2}gismx;
}
File::Slurp::write_file( File::Spec->catfile( $WIDGET_PATH, $INFO ), $info );

my $label = $LABEL;
my $target;
my $index;

# Package for W3C/Opera
$target = $WIDGET_PATH . $WIDGET_EXT;
system( @CPR, $WIDGET_PATH, $target );
$index = File::Slurp::read_file( File::Spec->catfile( $target, $INDEX ),
    err_mode => $ERR_MODE_SLURP );
$index =~ s{$RE_APPLE}{}gismx;
File::Slurp::write_file( File::Spec->catfile( $target, $INDEX ), $index );
$info = File::Slurp::read_file( File::Spec->catfile( $target, $CONFIG ),
    err_mode => $ERR_MODE_SLURP );
$info =~ s{$RE_DEWOOKIE_NAME}{}ismx;
$info =~ s{$RE_DEWOOKIE_AUTHOR}{}gismx;
$info =~ s{$RE_DEWOOKIE_ICON}{}gismx;
$info =~ s{$RE_DEWOOKIE_NS}{}gismx;
$info =~ s{$RE_DEWOOKIE_ID}{}gismx;
$info =~ s{$RE_DEWOOKIE_LICENSE}{}gismx;
$info =~ s{$RE_DEWOOKIE_ACCESS}{}gismx;
File::Slurp::write_file( File::Spec->catfile( $target, $CONFIG ), $info );

File::Find::find(
    {
        wanted   => \&wanted,
        no_chdir => 1
    },
    ($target)
);
my $wgt_zip = Archive::Zip->new();
$wgt_zip->addTreeMatching(
    $target, undef, $ALL,
    sub {
        $_ !~ m{$WGT_ZIP_EXCLUDE}gismx;
    }
);
unless ( $wgt_zip->overwriteAs( $label . $WIDGET_EXT ) == AZ_OK ) {
    $log->logcroak('write error');
}
system( @RM, q{-Rf}, $target );
system( @RM, $label . $WIDGET_EXT . $SIG_EXT );
$opts{fast} || system( @GNUPG, $label . $WIDGET_EXT );

# Package for Wookie
$target = $WIDGET_PATH . $WOOKIE_WIDGET_EXT;
system( @CPR, $WIDGET_PATH, $target );
$index = File::Slurp::read_file( File::Spec->catfile( $target, $INDEX ),
    err_mode => $ERR_MODE_SLURP );
$index =~ s{$RE_APPLE}{}gismx;
File::Slurp::write_file( File::Spec->catfile( $target, $INDEX ), $index );
File::Find::find(
    {
        wanted   => \&wanted,
        no_chdir => 1
    },
    ($target)
);

my $wookie_zip = Archive::Zip->new();
$wookie_zip->addTreeMatching(
    $target, undef, $ALL,
    sub {
        $_ !~ m{$WGT_ZIP_EXCLUDE}gismx;
    }
);
unless ( $wookie_zip->overwriteAs( $label . $WOOKIE_WIDGET_EXT ) == AZ_OK ) {
    $log->logcroak('write error');
}
system( @RM, q{-Rf}, $target );
system( @RM, $label . $WOOKIE_WIDGET_EXT . $SIG_EXT );
$opts{fast} || system( @GNUPG, $label . $WOOKIE_WIDGET_EXT );

# Package for OS X Dashboard
system( @RM,  q{-Rf},       $label . $OSX_WIDGET_EXT );
system( @CPR, $WIDGET_PATH, $label . $OSX_WIDGET_EXT );
File::Find::find(
    {
        wanted   => \&wanted,
        no_chdir => 1
    },
    ( $label . $OSX_WIDGET_EXT )
);
my $wdgt_zip = Archive::Zip->new();
$wdgt_zip->addTreeMatching(
    $label . $OSX_WIDGET_EXT,
    $label . $OSX_WIDGET_EXT,
    $ALL,
    sub {
        $_ !~ m{$WDGT_ZIP_EXCLUDE}gismx;
    }
);
unless (
    $wdgt_zip->overwriteAs( $label . $OSX_WIDGET_EXT . $ZIP_EXT ) == AZ_OK )
{
    $log->logcroak('write error');
}
system( @RM, $label . $OSX_WIDGET_EXT . $ZIP_EXT . $SIG_EXT );
$opts{fast} || system( @GNUPG, $label . $OSX_WIDGET_EXT . $ZIP_EXT );

# Package for Nokia WRT
system( @CPR, $WIDGET_PATH, $WIDGET_PATH . $WRT_WIDGET_EXT );
system(
    @MV,
    File::Spec->catfile( $WIDGET_PATH . $WRT_WIDGET_EXT, $WRT_INFO ),
    File::Spec->catfile( $WIDGET_PATH . $WRT_WIDGET_EXT, $INFO )
);
$index = File::Slurp::read_file(
    File::Spec->catfile( $WIDGET_PATH . $WRT_WIDGET_EXT, $INDEX ),
    err_mode => $ERR_MODE_SLURP );
$index =~ s{$RE_APPLE}{}gismx;
File::Slurp::write_file(
    File::Spec->catfile( $WIDGET_PATH . $WRT_WIDGET_EXT, $INDEX ), $index );
File::Find::find(
    {
        wanted   => \&wanted,
        no_chdir => 1
    },
    ( $WIDGET_PATH . $WRT_WIDGET_EXT )
);

my $wgz_zip = Archive::Zip->new();
$wgz_zip->addTreeMatching(
    $WIDGET_PATH . $WRT_WIDGET_EXT,
    $label, $ALL,
    sub {
        $_ !~ m{$WGZ_ZIP_EXCLUDE}gismx;
    }
);
unless ( $wgz_zip->overwriteAs( $label . $WRT_WIDGET_EXT ) == AZ_OK ) {
    $log->logcroak('write error');
}
system( @RM, q{-Rf}, $WIDGET_PATH . $WRT_WIDGET_EXT );
system( @RM, $label . $WRT_WIDGET_EXT . $SIG_EXT );
$opts{fast} || system( @GNUPG, $label . $WRT_WIDGET_EXT );


