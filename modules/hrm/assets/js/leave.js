/* jshint devel:true */
/* global wpErpHr */
/* global wp */

;(function($) {
    'use strict';

    var Leave = {

        initialize: function() {
            var self = this;

            $( '.erp-hr-leave-policy' ).on( 'click', 'a#erp-leave-policy-new', self, this.policy.create );
            $( '.erp-hr-leave-policy' ).on( 'click', 'a.link, span.edit a', self, this.policy.edit );
            $( '.erp-hr-leave-policy' ).on( 'click', 'a.submitdelete', self, this.policy.remove );
            $( 'body' ).on( 'change', '#erp-hr-leave-req-from-date, #erp-hr-leave-req-to-date', self, this.leave.requestDates );
            $( 'body' ).on( 'change', '#erp-hr-leave-req-employee-id', self, this.leave.setPolicy );
            $( 'body' ).on( 'change', '#erp-hr-leave-req-leave-policy', self, this.leave.setAvailableDays );
            $( '.hrm-dashboard' ).on( 'click', '.erp-hr-new-leave-request-wrap a#erp-hr-new-leave-req', this.leave.takeLeave );
            $( '.erp-employee-single' ).on('submit', 'form#erp-hr-empl-leave-history', this.leave.showHistory );
            $( '.entitlement-list-table' ).on( 'click', 'a.submitdelete', self, this.entitlement.remove );

            //Holiday
            $( '.erp-hr-holiday-wrap' ).on( 'click', 'a#erp-hr-new-holiday', self, this.holiday.create );
            $( '.erp-hr-holiday-wrap' ).on( 'click', '.erp-hr-holiday-edit', self, this.holiday.edit );
            $( '.erp-hr-holiday-wrap' ).on( 'click', '.erp-hr-holiday-delete', self, this.holiday.remove );
            $( 'body' ).on( 'change', '.erp-hr-holiday-date-range', self, this.holiday.checkRange );

            // ICal calendar import
            $( '.erp-hr-holiday-wrap' ).on( 'click', '#erp-hr-import-ical', self, this.importICalInit );
            $( '.erp-hr-holiday-wrap' ).on( 'change', '#erp-ical-input', self, this.uploadICal );

            $( '.erp-hr-leave-requests' ).on( 'click', '.erp-hr-leave-reject-btn', self, this.leave.reject );

            this.initDateField();
        },

        initDateField: function() {
            $( '.erp-leave-date-field' ).datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true
            });

            $( ".erp-leave-date-picker-from" ).datepicker({
                dateFormat: 'yy-mm-dd',
                changeYear: true,
                changeMonth: true,
                numberOfMonths: 1,
                onClose: function( selectedDate ) {
                    $( ".erp-leave-date-picker-to" ).datepicker( "option", "minDate", selectedDate );
                }
            });

            $( ".erp-leave-date-picker-to" ).datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true,
                numberOfMonths: 1,
                onClose: function( selectedDate ) {
                    $( ".erp-leave-date-picker-from" ).datepicker( "option", "maxDate", selectedDate );
                }
            });
        },

        holiday: {
            checkRange: function() {
                var self = $('input[name="range"]');

                if ( self.is(':checked') ) {
                    $('input[name="end_date"]').closest('.row').show();
                } else {
                    $('input[name="end_date"]').closest('.row').hide();
                }
            },

            create: function(e) {
                e.preventDefault();

                $.erpPopup({
                    title: wpErpHr.popup.holiday,
                    button: wpErpHr.popup.holiday_create,
                    id: 'erp-hr-holiday-create-popup',
                    content: wperp.template('erp-hr-holiday-js-tmp')({ data: null }).trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        Leave.initDateField();
                        Leave.holiday.checkRange();
                    },
                    onSubmit: function(modal) {
                        e.data.holiday.submit.call(this, modal);
                    }
                }); //popup
            },

            edit: function(e) {
                e.preventDefault();
                var self = $(this);
                $.erpPopup({
                    title: wpErpHr.popup.holiday,
                    button: wpErpHr.popup.holiday_update,
                    id: 'erp-hr-holiday-create-popup',
                    content: wperp.template('erp-hr-holiday-js-tmp')({ data: null }).trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        Leave.initDateField();
                        Leave.holiday.checkRange();
                        var modal = this;
                        $( 'header', modal).after( $('<div class="loader"></div>').show() );

                        wp.ajax.send( 'erp-hr-get-holiday', {
                            data: {
                                id: self.data('id'),
                                _wpnonce: wpErpHr.nonce
                            },
                            success: function(response) {
                                $( '.loader', modal).remove();
                                var holiday = response.holiday[0];

                                $( '#erp-hr-holiday-title', modal ).val( holiday.title );
                                $( '#erp-hr-holiday-start', modal ).val( holiday.start );
                                $( '#erp-hr-holiday-end', modal ).val( holiday.end );
                                $( '#erp-hr-holiday-id', modal ).val( holiday.id );
                                $( '#erp-hr-holiday-description', modal ).val( holiday.description );
                                $( '#erp-hr-holiday-action', modal ).val( 'erp_hr_holiday_create' );

                                if ( holiday.start != holiday.end ) {
                                    $( '#erp-hr-holiday-range' ).attr( 'checked', 'checked' );
                                    $( '#erp-hr-holiday-range' ).trigger( 'change' );
                                };
                            }
                        });
                    },
                    onSubmit: function(modal) {
                        e.data.holiday.submit.call(this, modal);
                    }
                }); //popup
            },

            /**
             * Remove holiday
             *
             * @param  {event}
             */
            remove: function(e) {
                e.preventDefault();

                var self = $(this);

                if ( confirm( wpErpHr.delConfirmHoliday ) ) {
                    wp.ajax.send( 'erp-hr-holiday-delete', {
                        data: {
                            '_wpnonce': wpErpHr.nonce,
                            id: self.data( 'id' )
                        },
                        success: function() {
                            self.closest('tr').fadeOut( 'fast', function() {
                                $(this).remove();
                            });
                        },
                        error: function(response) {
                            alert( response );
                        }
                    });
                }
            },

            submit: function(modal) {
                wp.ajax.send( {
                    data: this.serializeObject(),
                    success: function() {
                        modal.closeModal();

                        $( '.list-table-wrap' ).load( window.location.href + ' .list-wrap-inner', function() {
                            Leave.initDateField();
                        } );
                    },
                    error: function(error) {
                        modal.enableButton();
                        modal.showError( error );
                    }
                });
            },
        },

        policy: {
            periodField: function() {

                $('.erp-hr-leave-period').on( 'change', function() {
                    var self = $(this).val();
                    if ( self == 2 ) {
                        $('.showifschedule').slideDown();
                    } else {
                        $('.showifschedule').slideUp();
                    };
                });
            },

            submit: function(modal) {
                wp.ajax.send( {
                    data: this.serializeObject(),
                    success: function() {
                        modal.closeModal();

                        $( '.list-table-wrap' ).load( window.location.href + ' .list-wrap-inner' );
                    },
                    error: function(error) {
                        modal.enableButton();
                        alert( error );
                    }
                });
            },

            create: function(e) {
                e.preventDefault();

                $.erpPopup({
                    title: wpErpHr.popup.policy,
                    button: wpErpHr.popup.policy_create,
                    id: 'erp-hr-leave-policy-create-popup',
                    content: wp.template('erp-leave-policy')({ data: null }).trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        Leave.initDateField();
                        $('.erp-color-picker').wpColorPicker().wpColorPicker( 'color', '#fafafa' );
                        Leave.policy.periodField();
                    },
                    onSubmit: function(modal) {
                        e.data.policy.submit.call(this, modal);
                    }
                }); //popup
            },

            edit: function(e) {
                e.preventDefault();

                var self = $(this),
                    data = self.closest('tr').data('json');

                $.erpPopup({
                    title: wpErpHr.popup.policy,
                    button: wpErpHr.popup.update_status,
                    id: 'erp-hr-leave-policy-edit-popup',
                    content: wperp.template('erp-leave-policy')(data).trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        var modal = this;
                        Leave.initDateField();
                        $('.erp-color-picker').wpColorPicker();

                        $( 'div.row[data-selected]', modal ).each(function() {
                            var self = $(this),
                                selected = self.data('selected');

                            if ( selected !== '' ) {
                                self.find( 'select' ).val( selected );
                            }
                        });

                        $( 'div.row[data-checked]', modal ).each(function( key, val ) {
                            var self = $(this),
                                checked = self.data('checked');

                            if ( checked !== '' ) {
                                self.find( 'input[value="'+checked+'"]' ).attr( 'checked', 'checked' );
                            }
                        });

                        Leave.policy.periodField();
                        $('.erp-hr-leave-period').trigger('change');
                    },
                    onSubmit: function(modal) {
                        e.data.policy.submit.call(this, modal);
                    }
                }); //popup
            },

            remove: function(e) {
                e.preventDefault();

                var self = $(this);

                if ( confirm( wpErpHr.delConfirmPolicy ) ) {
                    wp.ajax.send( 'erp-hr-leave-policy-delete', {
                        data: {
                            '_wpnonce': wpErpHr.nonce,
                            id: self.data( 'id' )
                        },
                        success: function() {
                            self.closest('tr').fadeOut( 'fast', function() {
                                $(this).remove();
                            });
                        },
                        error: function(response) {
                            alert( response );
                        }
                    });
                }
            },
        },

        entitlement: {
            remove: function(e) {
                e.preventDefault();

                var self = $(this);

                if ( confirm( wpErpHr.delConfirmEntitlement ) ) {
                    wp.ajax.send( 'erp-hr-leave-entitlement-delete', {
                        data: {
                            '_wpnonce': wpErpHr.nonce,
                            id: self.data( 'id' ),
                            user_id: self.data( 'user_id' ),
                            policy_id: self.data( 'policy_id' ),
                        },
                        success: function() {
                            self.closest('tr').fadeOut( 'fast', function() {
                                $(this).remove();
                            });
                        },
                        error: function(response) {
                            alert( response );
                        }
                    });
                }
            }
        },

        leave: {
            takeLeave: function(e) {
                e.preventDefault();

                $.erpPopup({
                    title: wpErpHr.popup.new_leave_req,
                    button: wpErpHr.popup.take_leave,
                    id: 'erp-hr-new-leave-req-popup',
                    content: wp.template( 'erp-new-leave-req' )().trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        Leave.initDateField();
                    },
                    onSubmit: function(modal) {
                        $( 'button[type=submit]', '.erp-modal' ).attr( 'disabled', 'disabled' );

                        wp.ajax.send( {
                            data: this.serialize(),
                            success: function(res) {
                                modal.enableButton();
                                alert( res );
                                modal.closeModal();
                            },
                            error: function(error) {
                                modal.enableButton();
                                modal.showError( error );
                            }
                        });
                    }
                });
            },

            requestDates: function() {
                var from = $('#erp-hr-leave-req-from-date').val(),
                    to = $('#erp-hr-leave-req-to-date').val(),
                    submit = $(this).closest('form').find('input[type=submit]'),
                    user_id = parseInt( $( '#erp-hr-leave-req-employee-id').val() ),
                    type = $('#erp-hr-leave-req-leave-policy').val();

                if ( from !== '' && to !== '' ) {

                    wp.ajax.send( 'erp-hr-leave-request-req-date', {
                        data: {
                            '_wpnonce': wpErpHr.nonce,
                            from: from,
                            to: to,
                            employee_id: user_id,
                            type : type
                        },
                        success: function(resp) {
                            var html = wp.template('erp-leave-days')(resp.print);

                            $('div.erp-hr-leave-req-show-days').html( html );
                        
                            if ( parseInt( resp.leave_count ) <= 0 ) {
                                submit.prop('disabled', true);
                            } else {
                                submit.prop('disabled', false);
                            }
                            
                        },
                        error: function(response) {
                            $('div.erp-hr-leave-req-show-days').empty();
                            submit.attr( 'disabled', 'disable' );
                            if ( typeof response != 'undefined' ) {
                                alert( response );
                            }
                        }
                    });
                }
            },

            setPolicy: function() {
                Leave.leave.resetDateRange();
                var self = $(this),
                    leaveWrap = $('div.erp-hr-leave-reqs-wrap'),
                    leavetypewrap = leaveWrap.find('.erp-hr-leave-type-wrapper')

                leavetypewrap.html('');

                if ( self.val() == 0 ) {
                    return;
                };

                wp.ajax.send( 'erp-hr-leave-employee-assign-policies', {
                    data: {
                        '_wpnonce'  : wpErpHr.nonce,
                        employee_id : self.val()
                    },
                    success: function(resp) {
                        leavetypewrap.html( resp ).hide().fadeIn();
                        leaveWrap.find( 'input[type="text"], textarea').removeAttr('disabled');
                    },
                    error: function(resp) {
                        leavetypewrap.html( wpErpHr.empty_entitlement_text ).hide().fadeIn();
                        // alert( resp );
                    }
                } );
            },

            setAvailableDays: function() {
                Leave.leave.resetDateRange();
                var self = $(this);

                wp.ajax.send( 'erp-hr-leave-policies-availablity', {
                    data: {
                        '_wpnonce'  : wpErpHr.nonce,
                        employee_id : $('#erp-hr-leave-req-employee-id').val(),
                        policy_id   : self.val()
                    },
                    success: function(resp) {
                        self.closest('div.row').find('span.description').remove();
                        $(resp).insertAfter(self);
                    },
                    error: function(resp) {
                        alert( resp );
                    }
                } );
            },

            resetDateRange: function() {
                $('#erp-hr-leave-req-from-date').val('');
                $('#erp-hr-leave-req-to-date').val('');
                $('div.erp-hr-leave-req-show-days').html('');
            },

            showHistory: function(e) {
                e.preventDefault();

                var form = $(this);

                wp.ajax.send( 'erp-hr-empl-leave-history', {
                    data: form.serializeObject(),
                    success: function(resp) {
                        $('table#erp-hr-empl-leave-history tbody').html(resp);
                    }
                } );
            },

            pageReload: function() {
                $( '.erp-hr-leave-requests' ).load( window.location.href + ' .erp-hr-leave-requests-inner' );
            },


            reject: function(e) {
                e.preventDefault();

                var self = $(this),
                data = {
                    id : self.data('id')
                }

                $.erpPopup({
                    title: wpErpHr.popup.leave_reject,
                    button: wpErpHr.popup.update_status,
                    id: 'erp-hr-leave-reject-popup',
                    content: wperp.template('erp-hr-leave-reject-js-tmp')(data).trim(),
                    extraClass: 'smaller',
                    onSubmit: function(modal) {
                        wp.ajax.send( {
                            data: this.serialize()+'&_wpnonce='+wpErpHr.nonce,
                            success: function(res) {
                                Leave.leave.pageReload();
                                modal.closeModal();
                                //location.reload();
                            },
                            error: function(error) {
                                modal.showError( error );
                            }
                        });
                    }
                }); //popup
            }
        },

        importICalInit: function ( e ) {
            e.preventDefault();
            $( 'body #erp-ical-input' ).trigger( 'click' );
        },

        uploadICal: function ( e ) {
            e.preventDefault();

            var icsFile = e.target.files[0],
                data = new FormData(),
                form = $(this).parents('form');

            data.append( 'ics', icsFile );
            data.append( 'action', 'erp-hr-import-ical' );
            data.append( '_wpnonce', wpErpHr.nonce );

            wp.ajax.send( {
                data: data,
                cache: false,
                processData: false,
                contentType: false,
                success: function() {
                    $( '.list-table-wrap' ).load( window.location.href + ' .list-wrap-inner', function() {
                        Leave.initDateField();
                    } );

                    form[0].reset();
                },
                error: function(error) {
                    form[0].reset();
                    alert( error );
                }
            });
        }
    };

    $(function() {
        Leave.initialize();
    });

})(jQuery);
